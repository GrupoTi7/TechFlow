const axios = require('axios');
const prisma = require('../config/prismaClient');

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

    const computersResponse = await axios.get(`${GLPI_BASE_URL}/Computer`, {
      headers: {
        'Content-Type': 'application/json',
        'Session-Token': sessionToken,
        'App-Token': GLPI_APP_TOKEN,
      },
      params: { is_deleted: 0, range: '0-9999' }
    });

    const glpiDevices = computersResponse.data;
    if (!glpiDevices || !glpiDevices.length) {
      console.log('Nenhum dispositivo encontrado no GLPI.');
      return { success: true, message: 'Nenhum dispositivo encontrado no GLPI.' };
    }
    console.log(`${glpiDevices.length} dispositivos encontrados no GLPI.`);

    for (const glpiDevice of glpiDevices) {
      const deviceData = {
        name: glpiDevice.name,
        serialNumber: glpiDevice.serial || null,
        locationId: glpiDevice.locations_id || null,
      };

      await prisma.device.upsert({
        where: { glpiId: glpiDevice.id },
        update: deviceData,
        create: { glpiId: glpiDevice.id, ...deviceData },
      });
    }

    console.log('Sincronização concluída! Dispositivos criados ou atualizados no banco local.');

    return {
      success: true,
      message: 'Sincronização via API concluída com sucesso!',
      totalFound: glpiDevices.length,
    };

  } catch (error) {
    const errorMessage = error.response?.data?.[1] || error.message;
    console.error('ERRO DURANTE A SINCRONIZAÇÃO VIA API:', errorMessage);
    throw new Error(`Falha ao sincronizar com o GLPI: ${errorMessage}`);
  } finally {
    if (sessionToken) {
      await axios.get(`${GLPI_BASE_URL}/killSession`, {
        headers: {
          'Content-Type': 'application/json',
          'Session-Token': sessionToken,
          'App-Token': GLPI_APP_TOKEN,
        },
      });
      console.log('Sessão com GLPI encerrada.');
    }
  }
}

module.exports = { syncDevicesFromGLPI };