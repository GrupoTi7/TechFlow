const axios = require('axios');
const { prisma } = require('../config/prismaClient');

async function syncDevicesFromGLPI() {
  console.log('--- INICIANDO SINCRONIZAÇÃO VIA API GLPI ---');
  
  const GLPI_BASE_URL = process.env.GLPI_API_URL;
  const GLPI_APP_TOKEN = process.env.GLPI_APP_TOKEN;
  const GLPI_USER_TOKEN = process.env.GLPI_USER_TOKEN;

  if (!GLPI_BASE_URL || !GLPI_APP_TOKEN || !GLPI_USER_TOKEN) {
    throw new Error('As variáveis de ambiente do GLPI não estão configuradas corretamente no ficheiro .env');
  }

  let sessionToken;

  try {
    const sessionResponse = await axios.get(`${GLPI_BASE_URL}/initSession`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `user_token ${GLPI_USER_TOKEN}`,
        'App-Token': GLPI_APP_TOKEN,
      },
    });
    sessionToken = sessionResponse.data.session_token;
    console.log('Sessão com GLPI iniciada com sucesso.');

    // Vamos buscar Computadores e Impressoras
    const computerPromise = axios.get(`${GLPI_BASE_URL}/Computer`, {
      headers: { 'Content-Type': 'application/json', 'Session-Token': sessionToken, 'App-Token': GLPI_APP_TOKEN },
      params: { is_deleted: 0, range: '0-9999' }
    });
    const printerPromise = axios.get(`${GLPI_BASE_URL}/Printer`, {
        headers: { 'Content-Type': 'application/json', 'Session-Token': sessionToken, 'App-Token': GLPI_APP_TOKEN },
        params: { is_deleted: 0, range: '0-9999' }
    });

    // Executa as duas requisições em paralelo para mais eficiência
    const [computersResponse, printersResponse] = await Promise.all([computerPromise, printerPromise]);

    const glpiComputers = computersResponse.data;
    const glpiPrinters = printersResponse.data;
    const allGlpiDevices = [...glpiComputers, ...glpiPrinters];

    console.log(`${allGlpiDevices.length} dispositivos encontrados no GLPI (${glpiComputers.length} computadores, ${glpiPrinters.length} impressoras).`);

    for (const glpiDevice of allGlpiDevices) {
      // ESTE É O MAPEAMENTO CORRETO, ALINHADO COM O SEU SCHEMA MAIS RECENTE
      const deviceData = {
        name: glpiDevice.name,
        serial: glpiDevice.serial || null,
        otherserial: glpiDevice.otherserial || null,
        contact: glpiDevice.contact || null,
        comment: glpiDevice.comment || null,
        // Determina o tipo com base no endpoint de origem do dispositivo
        deviceType: glpiComputers.some(c => c.id === glpiDevice.id) ? 'computer' : 'printer',
        glpiDateMod: new Date(glpiDevice.date_mod),
        lastSync: new Date(),
      };

      await prisma.device.upsert({
        where: { glpiId: glpiDevice.id },
        update: deviceData,
        create: {
          glpiId: glpiDevice.id,
          ...deviceData,
        },
      });
    }
    
    console.log('Sincronização concluída! Dispositivos criados ou atualizados no banco local.');
    
    return {
      success: true,
      message: 'Sincronização via API concluída com sucesso!',
      totalFound: allGlpiDevices.length,
    };

  } catch (error) {
    const errorMessage = error.response?.data?.[1] || error.message;
    console.error('ERRO DURANTE A SINCRONIZAÇÃO VIA API:', errorMessage);
    throw new Error(`Falha ao sincronizar com o GLPI: ${errorMessage}`);
  } finally {
    if (sessionToken) {
      await axios.get(`${GLPI_BASE_URL}/killSession`, {
        headers: { 'Content-Type': 'application/json', 'Session-Token': sessionToken, 'App-Token': GLPI_APP_TOKEN },
      });
      console.log('Sessão com GLPI encerrada.');
    }
  }
}

module.exports = { syncDevicesFromGLPI };