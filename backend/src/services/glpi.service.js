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

// --- FUNÇÃO DE LOGIN (Basic Auth - Correta) ---
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
      console.log('Sessão GLPI (Basic Auth) iniciada com sucesso.');
      return response.data.session_token;
    } else { throw new Error('Resposta do initSession não continha um session_token.'); }
  } catch (error) {
    console.error('Erro ao iniciar sessão no GLPI (Basic Auth):', error.message);
    throw new Error('Falha ao autenticar no GLPI. Verifique GLPI_LOGIN e GLPI_PASSWORD no .env.');
  }
}

// --- FUNÇÃO DE BUSCAR LISTA (Correta) ---
async function fetchAllDevicesFromGLPI(sessionToken) {
  console.log('Buscando lista principal de dispositivos...');
  try {
  	const response = await axios.get(`${GLPI_API_URL_BASE}/Computer`, {
    	params: { 'range': '0-9999', 'is_deleted': 0, 'expand_dropdowns': true },
    	headers: { 'Content-Type': 'application/json', 'App-Token': GLPI_APP_TOKEN, 'Session-Token': sessionToken }
  	});
  	const responseData = response.data;
  	if (Array.isArray(responseData)) return responseData;
  	// ... (lógica para encontrar o array)
  	if (typeof responseData === 'object' && responseData !== null) {
    	const possibleKeys = ['data', 'records', 'Computer'];
    	for (const key of possibleKeys) {
      	if (Array.isArray(responseData[key])) {
        	console.log(`Array encontrado na chave '${key}' com ${responseData[key].length} itens.`);
        	return responseData[key];
      	}
    	}
    	const dataKeys = Object.keys(responseData);
    	const arrayKey = dataKeys.find(key => Array.isArray(responseData[key]));
    	if (arrayKey) {
      	console.log(`Array encontrado na chave '${arrayKey}' com ${responseData[arrayKey].length} itens.`);
      	return responseData[arrayKey];
    	}
  	}
  	throw new Error('Formato de resposta inesperado do GLPI.');
  } catch (error) {
  	console.error('Erro na comunicação com a API do GLPI (Etapa B):', error.message);
  	throw new Error('Falha ao buscar dados do GLPI.');
  }
}

// --- FUNÇÕES-ASSISTENTES (SO, IP, Tag - Corretas) ---
async function fetchDeviceSO(deviceId, sessionToken) {
  try {
    const itemOsRes = await axios.get(`${GLPI_API_URL_BASE}/Computer/${deviceId}/Item_OperatingSystem`, {
      headers: { 'App-Token': GLPI_APP_TOKEN, 'Session-Token': sessionToken }
    });
    if (!Array.isArray(itemOsRes.data) || itemOsRes.data.length === 0) return null;
    const itemOs = itemOsRes.data[0];
    
    // Precisamos apenas do nome do SO (ID 45 do seu log)
    const osNameRes = await axios.get(`${GLPI_API_URL_BASE}/OperatingSystem/${itemOs.operatingsystems_id}`, { 
      headers: { 'App-Token': GLPI_APP_TOKEN, 'Session-Token': sessionToken } 
    });
    return osNameRes.data.name || null;

  } catch (error) {
    console.warn(`Aviso: Não foi possível buscar SO para device ${deviceId}.`, error.message);
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
        return ipRes.data[0].name; // Encontrou o IP, retorna
      }
    }
    return null; 
  } catch (error) {
    console.warn(`Aviso: Não foi possível buscar IP para device ${deviceId}.`, error.message);
    return null;
  }
}

async function fetchDeviceTag(deviceId, sessionToken) {
  try {
    const res = await axios.get(`${GLPI_API_URL_BASE}/Computer/${deviceId}/Infocom`, {
      headers: { 'App-Token': GLPI_APP_TOKEN, 'Session-Token': sessionToken }
    });
    if (typeof res.data === 'object' && res.data !== null) {
      // O seu JSON de inventário 'VIVOPE0A4FZY' mostrou o campo 'tag' (ID 901)
      return res.data.tag || res.data.inventory_number || null;
    }
    return null;
  } catch (error) {
    console.warn(`Aviso: Não foi possível buscar Infocom (Tag) para device ${deviceId}.`, error.message);
    return null;
  }
}


/**
 * ===================================================================
 * ETAPA C: SINCRONIZAR O BANCO (Função principal CORRIGIDA)
 * ===================================================================
 */
async function syncGlpiDevices() {
  console.log('Iniciando sincronização de dispositivos...');
  const freshSessionToken = await getGlpiSessionToken();
  const glpiDevices = await fetchAllDevicesFromGLPI(freshSessionToken);
  
  if (!glpiDevices || glpiDevices.length === 0) {
    throw new Error('Nenhum dispositivo encontrado no GLPI.');
  }
  
  console.log(`Encontrados ${glpiDevices.length} dispositivos.`);
  
  // --- CONFIGURAÇÃO DE VELOCIDADE ---
  // Quantos dispositivos processar AO MESMO TEMPO.
  // 20 a 30 é seguro. 50+ pode deixar o GLPI lento ou dar erro de timeout.
  const BATCH_SIZE = 25; 
  // ----------------------------------

  let enhancedDevicesData = [];
  
  // Loop para processar em blocos (Chunks)
  for (let i = 0; i < glpiDevices.length; i += BATCH_SIZE) {
    const batch = glpiDevices.slice(i, i + BATCH_SIZE);
    console.log(`Processando lote ${Math.ceil((i + 1) / BATCH_SIZE)} de ${Math.ceil(glpiDevices.length / BATCH_SIZE)}... (Dispositivos ${i + 1} a ${Math.min(i + BATCH_SIZE, glpiDevices.length)})`);

    // Aqui está a mágica: Promise.all dispara todas as requisições do lote SIMULTANEAMENTE
    const batchResults = await Promise.all(batch.map(async (device) => {
      try {
        // Dispara as 3 buscas ao mesmo tempo para este dispositivo também
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
        // Retorna o dispositivo com dados parciais para não quebrar o lote inteiro
        return { ...device, operatingSystem: null, ipAddress: null, inventoryTag: null };
      }
    }));

    // Adiciona os resultados deste lote à lista final
    enhancedDevicesData.push(...batchResults);
  }

  console.log('Busca avançada concluída. Atualizando banco de dados...');

  // --- PREPARAÇÃO PARA O BANCO ---
  const glpiDeviceIds = enhancedDevicesData.map(device => device.id); 
  const operations = enhancedDevicesData.map(glpiDevice => {
    const deviceData = {
      name: glpiDevice.name,
      serial: glpiDevice.serial || null,
      otherserial: glpiDevice.otherserial || null,
      contact: glpiDevice.contact || null,
      comment: glpiDevice.comment || null,
      deviceType: typeof glpiDevice.computertypes_id === 'string' ? glpiDevice.computertypes_id : 'Desconhecido', // Pequena proteção de tipo
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
        setor: null,
        maintenanceIntervalDays: null
      }
    });
  });

  // Dica: Se tiver MUITOS dispositivos (1000+), o $transaction pode falhar.
  // Para 400, ainda deve aguentar bem.
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