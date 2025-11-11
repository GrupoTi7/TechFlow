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
  
  console.log(`Encontrados ${glpiDevices.length} dispositivos. Buscando SO, IP e Tag em modo serial... (Isto VAI demorar MUITO)`);

  // --- ETAPA B.5: BUSCA AVANÇADA (EM LOOP SERIAL) ---
  let enhancedDevicesData = [];
  let count = 0;

  for (const device of glpiDevices) {
    count++;
    console.log(`Processando dispositivo ${count} de ${glpiDevices.length}: ${device.name}`);
    
    // Fazemos as chamadas UMA DE CADA VEZ para não sobrecarregar
    const operatingSystem = await fetchDeviceSO(device.id, freshSessionToken);
    const ipAddress = await fetchDeviceIP(device.id, freshSessionToken);
    const inventoryTag = await fetchDeviceTag(device.id, freshSessionToken);
    
    enhancedDevicesData.push({
      ...device, 
      operatingSystem: operatingSystem,
      ipAddress: ipAddress,
      inventoryTag: inventoryTag
    });
  }
  // ------------------------------------------

  console.log('Busca avançada concluída. Atualizando banco de dados...');

  const glpiDeviceIds = enhancedDevicesData.map(device => device.id); 
  const operations = enhancedDevicesData.map(glpiDevice => {

    // --- REMOVEMOS A LÓGICA DE CATEGORIZAÇÃO (30/120 DIAS) DAQUI ---

  	const deviceData = {
    	name: glpiDevice.name,
    	serial: glpiDevice.serial || null,
    	otherserial: glpiDevice.otherserial || null,
    	contact: glpiDevice.contact || null,
    	comment: glpiDevice.comment || null,
    	deviceType: glpiDevice.computertypes_id || 'Desconhecido',
    	department: glpiDevice.locations_id || null, 
      manufacturer: glpiDevice.manufacturers_id || null, 
      model: glpiDevice.computermodels_id || null, 
    	glpiDateMod: new Date(glpiDevice.date_mod),
    	isActive: true,
      operatingSystem: glpiDevice.operatingSystem,
      ipAddress: glpiDevice.ipAddress, 
      inventoryTag: glpiDevice.inventoryTag, 
      // O campo 'maintenanceIntervalDays' FOI REMOVIDO daqui
  	};

  	return prisma.device.upsert({
    	where: { glpiId: glpiDevice.id }, 
    	update: deviceData, // Atualiza dados do GLPI, NÃO TOCA no 'setor' ou 'maintenanceIntervalDays'
    	create: {
      	glpiId: glpiDevice.id,
      	...deviceData,
        setor: null, // Padrão 'null' (limpo)
        maintenanceIntervalDays: null // Padrão 'null' (limpo)
    	}
  	});
  });

  await prisma.$transaction(operations);

  const deactivationResult = await prisma.device.updateMany({
  	where: { glpiId: { notIn: glpiDeviceIds }, isActive: true },
  	data: { isActive: false }
  });
  if (deactivationResult.count > 0) {
  	  console.log(`Desativados ${deactivationResult.count} dispositivos antigos.`);
  }
  console.log(`Sincronização concluída. ${enhancedDevicesData.length} dispositivos processados (com SO, IP e Tag).`);
  return { 
  	success: true, 
  	processed: enhancedDevicesData.length, 
  	deactivated: deactivationResult.count 
  };
} // <-- Fim da função async syncGlpiDevices()

module.exports = { 
  syncGlpiDevices 
};