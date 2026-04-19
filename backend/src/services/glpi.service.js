// src/services/glpi.service.js
const axios = require('axios');
const { prisma } = require('../config/prismaClient');
const { Buffer } = require('buffer'); 

// --- CREDENCIAIS ---
const GLPI_API_URL_BASE = 'http://glpi10.ptractor.com.br:8089/apirest.php';
const GLPI_APP_TOKEN = 'gmrK2vteuRODebNH8q0vucMlV1mtmXi5gVRB3SKG';
const GLPI_LOGIN = process.env.GLPI_LOGIN;
const GLPI_PASSWORD = process.env.GLPI_PASSWORD;
// -------------------

// --- FUNÇÃO DE LOGIN (Basic Auth) ---
async function getGlpiSessionToken() {
  console.log('Iniciando sessão no GLPI (com Basic Auth)...');
  if (!GLPI_LOGIN || !GLPI_PASSWORD) {
    throw new Error('GLPI_LOGIN ou GLPI_PASSWORD não encontrados no arquivo .env');
  }
  const credentials = Buffer.from(`${GLPI_LOGIN}:${GLPI_PASSWORD}`).toString('base64');
  try {
    const response = await axios.get(`${GLPI_API_URL_BASE}/initSession`, {
      headers: {
        'Content-Type': 'application/json',
        'App-Token': GLPI_APP_TOKEN, 
        'Authorization': `Basic ${credentials}` 
      }
    });
    if (response.data && response.data.session_token) {
      console.log('Sessão GLPI iniciada com sucesso.');
      return response.data.session_token;
    } else { throw new Error('Resposta do initSession não continha um session_token.'); }
  } catch (error) {
    console.error('Erro ao iniciar sessão no GLPI:', error.message);
    throw new Error('Falha ao autenticar no GLPI. Verifique credenciais no .env.');
  }
}

// --- FUNÇÃO DE BUSCAR LISTA (Computadores + Rede) ---
async function fetchAllDevicesFromGLPI(sessionToken) {
  console.log('Buscando dispositivos...');
  
  // Rota 1: Computadores (Desktops, Notebooks, etc)
  const computadoresRes = await axios.get(`${GLPI_API_URL_BASE}/Computer`, {
    params: { 'range': '0-9999', 'is_deleted': 0, 'expand_dropdowns': true },
    headers: { 'Content-Type': 'application/json', 'App-Token': GLPI_APP_TOKEN, 'Session-Token': sessionToken }
  });

  // Rota 2: Equipamentos de Rede (Switches, APs)
  const redesRes = await axios.get(`${GLPI_API_URL_BASE}/NetworkEquipment`, {
    params: { 'range': '0-9999', 'is_deleted': 0, 'expand_dropdowns': true },
    headers: { 'Content-Type': 'application/json', 'App-Token': GLPI_APP_TOKEN, 'Session-Token': sessionToken }
  });

  let todosDispositivos = [];

  // Função auxiliar interna para extrair os arrays corretamente
  const extractArray = (responseData, defaultType) => {
    let extracted = [];
    if (Array.isArray(responseData)) extracted = responseData;
    else if (typeof responseData === 'object' && responseData !== null) {
      const possibleKeys = ['data', 'records', 'Computer', 'NetworkEquipment'];
      for (const key of possibleKeys) {
        if (Array.isArray(responseData[key])) {
          extracted = responseData[key];
          break;
        }
      }
    }
    // Injeta o _forcedType (essencial para os equipamentos de rede)
    return extracted.map(item => ({...item, _forcedType: defaultType}));
  };

  const listaComputadores = extractArray(computadoresRes.data, null);
  console.log(`Encontrados ${listaComputadores.length} computadores.`);
  
  const listaRedes = extractArray(redesRes.data, 'Switch/AP');
  console.log(`Encontrados ${listaRedes.length} equipamentos de rede.`);

  todosDispositivos = [...listaComputadores, ...listaRedes];
  return todosDispositivos;
}

// --- FUNÇÕES-ASSISTENTES (SO, IP, Tag) ---
async function fetchDeviceSO(deviceId, sessionToken) {
  try {
    const itemOsRes = await axios.get(`${GLPI_API_URL_BASE}/Computer/${deviceId}/Item_OperatingSystem`, {
      headers: { 'App-Token': GLPI_APP_TOKEN, 'Session-Token': sessionToken }
    });
    if (!Array.isArray(itemOsRes.data) || itemOsRes.data.length === 0) return null;
    const itemOs = itemOsRes.data[0];
    
    const osNameRes = await axios.get(`${GLPI_API_URL_BASE}/OperatingSystem/${itemOs.operatingsystems_id}`, { 
      headers: { 'App-Token': GLPI_APP_TOKEN, 'Session-Token': sessionToken } 
    });
    return osNameRes.data.name || null;
  } catch (error) {
    return null;
  }
}

async function fetchDeviceIP(deviceId, sessionToken) {
  try {
    const portRes = await axios.get(`${GLPI_API_URL_BASE}/Computer/${deviceId}/NetworkPort`, {
      headers: { 'App-Token': GLPI_APP_TOKEN, 'Session-Token': sessionToken }
    });
    if (!Array.isArray(portRes.data) || portRes.data.length === 0) return null;

    for (const port of portRes.data) {
      const ipRes = await axios.get(`${GLPI_API_URL_BASE}/NetworkPort/${port.id}/IPAddress`, {
         headers: { 'App-Token': GLPI_APP_TOKEN, 'Session-Token': sessionToken }
      });
      if (Array.isArray(ipRes.data) && ipRes.data.length > 0 && ipRes.data[0].name) {
        return ipRes.data[0].name; 
      }
    }
    return null; 
  } catch (error) {
    return null;
  }
}

async function fetchDeviceTag(deviceId, sessionToken) {
  try {
    const res = await axios.get(`${GLPI_API_URL_BASE}/Computer/${deviceId}/Infocom`, {
      headers: { 'App-Token': GLPI_APP_TOKEN, 'Session-Token': sessionToken }
    });
    if (typeof res.data === 'object' && res.data !== null) {
      return res.data.tag || res.data.inventory_number || null;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * ===================================================================
 * ETAPA C: SINCRONIZAR O BANCO 
 * ===================================================================
 */
async function syncGlpiDevices() {
  console.log('Iniciando sincronização de dispositivos...');
  const freshSessionToken = await getGlpiSessionToken();
  const glpiDevices = await fetchAllDevicesFromGLPI(freshSessionToken);
  
  if (!glpiDevices || glpiDevices.length === 0) {
    throw new Error('Nenhum dispositivo encontrado no GLPI.');
  }
  
  console.log(`Encontrados ${glpiDevices.length} dispositivos totais para processamento.`);
  
  const BATCH_SIZE = 45; 

  let enhancedDevicesData = [];
  
  for (let i = 0; i < glpiDevices.length; i += BATCH_SIZE) {
    const batch = glpiDevices.slice(i, i + BATCH_SIZE);
    console.log(`Processando lote ${Math.ceil((i + 1) / BATCH_SIZE)} de ${Math.ceil(glpiDevices.length / BATCH_SIZE)}...`);

    const batchResults = await Promise.all(batch.map(async (device) => {
      try {
        // Se for Switch/AP, ele não tem SO, então não precisamos sobrecarregar o GLPI com essas chamadas.
        if (device._forcedType === 'Switch/AP') {
            // Nota: Se quiser buscar IP de Switch no futuro, pode adaptar aqui, 
            // mas por agora mantemos simples para não dar erro.
            return { ...device, operatingSystem: null, ipAddress: null, inventoryTag: null };
        }

        const [operatingSystem, ipAddress, inventoryTag] = await Promise.all([
            fetchDeviceSO(device.id, freshSessionToken),
            fetchDeviceIP(device.id, freshSessionToken),
            fetchDeviceTag(device.id, freshSessionToken)
        ]);

        return {
          ...device, 
          operatingSystem,
          ipAddress,
          inventoryTag
        };
      } catch (err) {
        console.error(`Erro ao processar dispositivo ${device.id}:`, err.message);
        return { ...device, operatingSystem: null, ipAddress: null, inventoryTag: null };
      }
    }));

    enhancedDevicesData.push(...batchResults);
  }

  console.log('Busca avançada concluída. Atualizando banco de dados...');

  const glpiDeviceIds = enhancedDevicesData.map(device => device.id); 
  const operations = enhancedDevicesData.map(glpiDevice => {
    
    const deviceData = {
      name: glpiDevice.name,
      serial: glpiDevice.serial || null,
      otherserial: glpiDevice.otherserial || null,
      contact: glpiDevice.contact || null,
      comment: glpiDevice.comment || null,
      
      // Lógica de Categorias Corrigida!
      deviceType: (() => {
        // 1. Se for um equipamento de rede, usa o tipo forçado (Switch/AP)
        if (glpiDevice._forcedType) return glpiDevice._forcedType;
        
        // 2. Captura o tipo original dos computadores
        const tipoOriginal = typeof glpiDevice.computertypes_id === 'string' ? glpiDevice.computertypes_id : 'Desconhecido';
        
        // 3. Limpeza: Tudo que for chassi bizarro vira "Desktop"
        const sinônimosDeDesktop = ['Mini PC', 'DX58SO', 'Main System Chassis', 'Mini Tower', 'Tower', 'Desktop'];
        return sinônimosDeDesktop.includes(tipoOriginal) ? 'Desktop' : tipoOriginal;
      })(),
      
      department: glpiDevice.locations_id || null, 
      manufacturer: glpiDevice.manufacturers_id || null, 
      model: glpiDevice.computermodels_id || null, 
      glpiDateMod: new Date(glpiDevice.date_mod),
      isActive: true,
      operatingSystem: glpiDevice.operatingSystem,
      ipAddress: glpiDevice.ipAddress, 
      inventoryTag: glpiDevice.inventoryTag, 
    };

    return prisma.device.upsert({
      where: { glpiId: glpiDevice.id }, 
      update: deviceData,
      create: {
        glpiId: glpiDevice.id,
        ...deviceData,
        maintenanceIntervalDays: null
      }
    });
  });

  await prisma.$transaction(operations);

  const deactivationResult = await prisma.device.updateMany({
    where: { glpiId: { notIn: glpiDeviceIds }, isActive: true },
    data: { isActive: false }
  });

  console.log(`Sincronização concluída. ${enhancedDevicesData.length} processados.`);
  
  return { 
    success: true, 
    processed: enhancedDevicesData.length, 
    deactivated: deactivationResult.count 
  };
}

module.exports = { 
  syncGlpiDevices 
};