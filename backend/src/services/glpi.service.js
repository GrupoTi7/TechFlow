// src/services/glpi.service.js
const axios = require('axios');
const { prisma } = require('../config/prismaClient');
const { Buffer } = require('buffer'); 

const GLPI_API_URL_BASE = 'http://glpi10.ptractor.com.br:8089/apirest.php';
const GLPI_APP_TOKEN = 'gmrK2vteuRODebNH8q0vucMlV1mtmXi5gVRB3SKG';
const GLPI_LOGIN = process.env.GLPI_LOGIN;
const GLPI_PASSWORD = process.env.GLPI_PASSWORD;

async function getGlpiSessionToken() {
  console.log('[GLPI] Iniciando sessão (Basic Auth)...');
  if (!GLPI_LOGIN || !GLPI_PASSWORD) throw new Error('GLPI_LOGIN ou GLPI_PASSWORD ausentes no .env');
  
  const credentials = Buffer.from(`${GLPI_LOGIN}:${GLPI_PASSWORD}`).toString('base64');
  try {
    const response = await axios.get(`${GLPI_API_URL_BASE}/initSession`, {
      headers: { 'Content-Type': 'application/json', 'App-Token': GLPI_APP_TOKEN, 'Authorization': `Basic ${credentials}` }
    });
    return response.data.session_token;
  } catch (error) {
    throw new Error('Falha ao autenticar no GLPI. Verifique as credenciais.');
  }
}

async function fetchAllDevicesFromGLPI(sessionToken) {
  console.log('[GLPI] Buscando dispositivos...');
  
  let computadoresRes = { data: [] };
  try {
    computadoresRes = await axios.get(`${GLPI_API_URL_BASE}/Computer`, {
      params: { 'range': '0-9999', 'is_deleted': 0, 'expand_dropdowns': true },
      headers: { 'Content-Type': 'application/json', 'App-Token': GLPI_APP_TOKEN, 'Session-Token': sessionToken }
    });
  } catch (error) {
    console.error('[GLPI] ERRO CRÍTICO ao buscar Computadores:', error.message);
    throw error; // Se os computadores falharem, não faz sentido continuar
  }

  let redesRes = { data: [] };
  try {
    // 🟢 PROTEÇÃO ADICIONADA: Se o token não tiver permissão para ver Switches, ele avisa mas não trava o sistema
    redesRes = await axios.get(`${GLPI_API_URL_BASE}/NetworkEquipment`, {
      params: { 'range': '0-9999', 'is_deleted': 0, 'expand_dropdowns': true },
      headers: { 'Content-Type': 'application/json', 'App-Token': GLPI_APP_TOKEN, 'Session-Token': sessionToken }
    });
  } catch (error) {
    console.warn('⚠️ [GLPI] AVISO: Falha ao buscar NetworkEquipment (Switches). Verifique as permissões da API. Ignorando equipamentos de rede. Erro:', error.message);
  }

  const extractArray = (responseData, defaultType) => {
    let extracted = [];
    if (Array.isArray(responseData)) extracted = responseData;
    else if (typeof responseData === 'object' && responseData !== null) {
      const possibleKeys = ['data', 'records', 'Computer', 'NetworkEquipment'];
      for (const key of possibleKeys) {
        if (Array.isArray(responseData[key])) { extracted = responseData[key]; break; }
      }
    }
    return extracted.map(item => ({...item, _forcedType: defaultType}));
  };

  const listaComputadores = extractArray(computadoresRes.data, null);
  console.log(`[GLPI] Encontrados ${listaComputadores.length} computadores.`);
  
  const listaRedes = extractArray(redesRes.data, 'Switch/AP');
  console.log(`[GLPI] Encontrados ${listaRedes.length} equipamentos de rede.`);

  return [...listaComputadores, ...listaRedes];
}

async function fetchDeviceSO(deviceId, sessionToken) {
  try {
    const itemOsRes = await axios.get(`${GLPI_API_URL_BASE}/Computer/${deviceId}/Item_OperatingSystem`, {
      headers: { 'App-Token': GLPI_APP_TOKEN, 'Session-Token': sessionToken }
    });
    if (!Array.isArray(itemOsRes.data) || itemOsRes.data.length === 0) return null;
    const osNameRes = await axios.get(`${GLPI_API_URL_BASE}/OperatingSystem/${itemOsRes.data[0].operatingsystems_id}`, { 
      headers: { 'App-Token': GLPI_APP_TOKEN, 'Session-Token': sessionToken } 
    });
    return osNameRes.data.name || null;
  } catch (error) { return null; }
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
      if (Array.isArray(ipRes.data) && ipRes.data.length > 0 && ipRes.data[0].name) return ipRes.data[0].name; 
    }
    return null; 
  } catch (error) { return null; }
}

async function fetchDeviceTag(deviceId, sessionToken) {
  try {
    const res = await axios.get(`${GLPI_API_URL_BASE}/Computer/${deviceId}/Infocom`, {
      headers: { 'App-Token': GLPI_APP_TOKEN, 'Session-Token': sessionToken }
    });
    return res.data?.tag || res.data?.inventory_number || null;
  } catch (error) { return null; }
}

async function syncGlpiDevices() {
  console.log('[GLPI] Iniciando sincronização total...');
  const freshSessionToken = await getGlpiSessionToken();
  const glpiDevices = await fetchAllDevicesFromGLPI(freshSessionToken);
  
  if (!glpiDevices || glpiDevices.length === 0) throw new Error('Nenhum dispositivo retornado do GLPI.');
  
  const BATCH_SIZE = 45; 
  let enhancedDevicesData = [];
  
  for (let i = 0; i < glpiDevices.length; i += BATCH_SIZE) {
    const batch = glpiDevices.slice(i, i + BATCH_SIZE);
    
    const batchResults = await Promise.all(batch.map(async (device) => {
      try {
        if (device._forcedType === 'Switch/AP') {
            return { ...device, operatingSystem: null, ipAddress: null, inventoryTag: null };
        }
        const [operatingSystem, ipAddress, inventoryTag] = await Promise.all([
            fetchDeviceSO(device.id, freshSessionToken),
            fetchDeviceIP(device.id, freshSessionToken),
            fetchDeviceTag(device.id, freshSessionToken)
        ]);
        return { ...device, operatingSystem, ipAddress, inventoryTag };
      } catch (err) {
        return { ...device, operatingSystem: null, ipAddress: null, inventoryTag: null };
      }
    }));
    enhancedDevicesData.push(...batchResults);
  }

  console.log('[GLPI] Atualizando banco de dados...');

  const glpiDeviceIds = enhancedDevicesData.map(device => device.id); 
  const operations = enhancedDevicesData.map(glpiDevice => {
    
    const deviceData = {
      name: glpiDevice.name,
      serial: glpiDevice.serial || null,
      otherserial: glpiDevice.otherserial || null,
      contact: glpiDevice.contact || null,
      comment: glpiDevice.comment || null,
      
      // 🟢 O NOVO DICIONÁRIO BLINDADO
      deviceType: (() => {
        if (glpiDevice._forcedType) return glpiDevice._forcedType;
        
        // Remove espaços vazios e transforma tudo em maiúsculas para evitar erros
        const tipoOriginal = String(glpiDevice.computertypes_id || 'Desconhecido').trim().toUpperCase();
        
        if (tipoOriginal.includes('MINI PC') || 
            tipoOriginal.includes('DX58SO') || 
            tipoOriginal.includes('CHASSIS') || 
            tipoOriginal.includes('TOWER') || 
            tipoOriginal.includes('DESKTOP')) {
          return 'Desktop';
        }
        
        return typeof glpiDevice.computertypes_id === 'string' ? glpiDevice.computertypes_id : 'Desconhecido';
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
    where: { 
      glpiId: { notIn: glpiDeviceIds, not: null }, // 🟢 Nunca desativa máquinas adicionadas manualmente (sem glpiId)
      deviceType: { notIn: ['Switch', 'AP', 'Switch/AP', 'WIFI'] }, // 🟢 Protege a Infraestrutura contra sumiços
      isActive: true 
    },
    data: { isActive: false }
  });

  console.log(`[GLPI] SUCESSO! ${enhancedDevicesData.length} processados.`);
  return { success: true, processed: enhancedDevicesData.length };
}

module.exports = { syncGlpiDevices };