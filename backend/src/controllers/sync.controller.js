// src/controllers/sync.controller.js
const glpiService = require('../services/glpi.service');
const { prisma } = require('../config/prismaClient');

class SyncController {
  async handleSync(req, res) {
    try {
      console.log('Controlador: Requisição de sincronização recebida.');
      
      const allDevices = await glpiService.fetchAllDevices();

      console.log(`Controlador: Salvando ${allDevices.length} dispositivos no banco de dados...`);
      for (const device of allDevices) {
        const deviceData = {
          name: device.name,
          serial: device.serial,
          otherserial: device.otherserial,
          contact: device.contact,
          comment: device.comment,
          deviceType: device.deviceType,
          glpiDateMod: new Date(device.date_mod), // date_mod vem do GLPI
          lastSync: new Date(),
        };

        // CORREÇÃO AQUI: Usamos device.id em vez de device.glpiId
        await prisma.device.upsert({
          where: { glpiId: device.id },
          update: deviceData,
          create: {
            glpiId: device.id,
            ...deviceData,
          },
        });
      }
      console.log('Controlador: Dispositivos salvos com sucesso.');

      await glpiService.killSession();

      res.status(200).json({
        success: true,
        message: 'Sincronização concluída com sucesso!',
        data: {
          totalDevices: allDevices.length,
          timestamp: new Date().toISOString(),
        },
      });

    } catch (error) {
      console.error('Erro no controlador de sincronização:', error);
      await glpiService.killSession();
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message,
      });
    }
  }
  
  async getSyncStats(req, res) {
    res.status(501).json({ 
      success: false, 
      message: 'Endpoint de estatísticas ainda não implementado.' 
    });
  }
}

module.exports = new SyncController();