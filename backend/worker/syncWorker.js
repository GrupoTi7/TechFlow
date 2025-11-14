// backend/src/syncWorker.js
const { Worker } = require('bullmq');
const axios = require('axios');
const { prisma } = require('./config/prismaClient'); // (Verifique este caminho)
const { Buffer } = require('buffer'); 

// --- CREDENCIAIS (Lidas das variáveis de ambiente) ---
const GLPI_API_URL_BASE = 'http://glpi10.ptractor.com.br:8089/apirest.php';
const GLPI_APP_TOKEN = 'gmrK2vteuRODebNH8q0vucMlV1mtmXi5gVRB3SKG';
const GLPI_LOGIN = process.env.GLPI_LOGIN;
const GLPI_PASSWORD = process.env.GLPI_PASSWORD;
// ----------------------------------

// --- Copiámos todas as suas funções do glpi.service.js para aqui ---

async function getGlpiSessionToken() {
  console.log('[Worker] Iniciando sessão no GLPI (com Basic Auth)...');
  if (!GLPI_LOGIN || !GLPI_PASSWORD) {
    throw new Error('GLPI_LOGIN ou GLPI_PASSWORD não encontrados no .env');
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
      console.log('[Worker] Sessão GLPI (Basic Auth) iniciada com sucesso.');
      return response.data.session_token;
    } else { throw new Error('Resposta do initSession não continha um session_token.'); }
  } catch (error) {
    console.error('[Worker] Erro ao iniciar sessão no GLPI (Basic Auth):', error.message);
    throw new Error('Falha ao autenticar no GLPI.');
  }
}

async function fetchAllDevicesFromGLPI(sessionToken) {
  console.log('[Worker] Buscando lista principal de dispositivos...');
  try {
  	const response = await axios.get(`${GLPI_API_URL_BASE}/Computer`, {
    	params: { 'range': '0-9999', 'is_deleted': 0, 'expand_dropdowns': true },
    	headers: { 'Content-Type': 'application/json', 'App-Token': GLPI_APP_TOKEN, 'Session-Token': sessionToken }
  	});
    // ... (lógica para encontrar o array, se necessário) ...
  	return response.data;
  } catch (error) {
  	console.error('[Worker] Erro na comunicação com a API do GLPI (Etapa B):', error.message);
  	throw new Error('Falha ao buscar dados do GLPI.');
  }
}

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
    console.warn(`[Worker] Aviso: Não foi possível buscar SO para device ${deviceId}.`, error.message);
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
    console.warn(`[Worker] Aviso: Não foi possível buscar IP para device ${deviceId}.`, error.message);
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
    console.warn(`[Worker] Aviso: Não foi possível buscar Infocom (Tag) para device ${deviceId}.`, error.message);
    return null;
  }
}

// --- A LÓGICA DE SINCRONIZAÇÃO (A Tarefa Pesada) ---
const fazerSincronizacaoPesada = async (job) => {
  console.log(`[Worker] Iniciando job ${job.id}: Sincronizando dispositivos...`);

  const freshSessionToken = await getGlpiSessionToken();
  const glpiDevices = await fetchAllDevicesFromGLPI(freshSessionToken);
  
  if (!glpiDevices || glpiDevices.length === 0) {
  	throw new Error('Nenhum dispositivo encontrado no GLPI.');
  }

  console.log(`[Worker] Encontrados ${glpiDevices.length} dispositivos. Buscando SO, IP e Tag em modo serial...`);

  let enhancedDevicesData = [];
  let count = 0;

  for (const device of glpiDevices) {
    count++;
    console.log(`[Worker] Processando dispositivo ${count} de ${glpiDevices.length}: ${device.name}`);

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

  console.log('[Worker] Busca avançada concluída. Atualizando banco de dados...');

  const glpiDeviceIds = enhancedDevicesData.map(device => device.id); 
  const operations = enhancedDevicesData.map(glpiDevice => {
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

  await prisma.$transaction(operations);

  const deactivationResult = await prisma.device.updateMany({
  	where: { glpiId: { notIn: glpiDeviceIds }, isActive: true },
  	data: { isActive: false }
  });

  const logMessage = `[Worker] Job ${job.id} concluído. ${enhancedDevicesData.length} dispositivos processados. ${deactivationResult.count} desativados.`;
  console.log(logMessage);
  return { status: "Completo", message: logMessage };
};

// --- O "OUVINTE" DO BULLMQ ---
console.log("Iniciando Worker de Sincronização...");
const worker = new Worker('syncQueue', fazerSincronizacaoPesada, {
  connection: {
    host: 'redis', // O nome do serviço no docker-compose
    port: 6379
  },
  // Aumenta o tempo limite do "lock" do job, 
  // pois esta tarefa pode demorar 15 minutos
  lockDuration: 1000 * 60 * 20 // 20 minutos
});

console.log('Worker de sincronização está a correr...');