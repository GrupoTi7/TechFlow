const deviceService = require('../services/device.service');
const { prisma } = require('../config/prismaClient');
const ping = require('ping');

async function getAllDevices(req, res) {
  try {
    const devices = await deviceService.findAllDevices(req.query); 
    const translatedDevices = devices.map(device => ({ ...device, setor: device.setorName || device.setor }));
    res.status(200).json({ success: true, count: translatedDevices.length, devices: translatedDevices });
  } catch (error) { res.status(500).json({ success: false, message: 'Erro ao buscar dispositivos.', error: error.message }); }
}

async function getDeviceById(req, res) {
  try {
    const { id } = req.params; 
    const device = await deviceService.findDeviceById(id);
    if (device) device.setor = device.setorName || device.setor;
    res.status(200).json({ success: true, device: device });
  } catch (error) { res.status(404).json({ success: false, message: error.message }); }
}

async function cleanupDefaultValues(req, res) {
  try {
    const count = await deviceService.cleanupDefaultValues();
    res.status(200).json({ success: true, message: `${count} dispositivos limpos.` });
  } catch (error) { res.status(500).json({ success: false, message: 'Erro ao limpar', error: error.message }); }
}

async function bulkUpdateSetors(req, res) {
  try {
    const updates = req.body.updates;
    if (!Array.isArray(updates) || updates.length === 0) return res.status(400).json({ success: false, message: 'Nenhuma atualização fornecida.' });
    const count = await deviceService.bulkUpdateSetors(updates);
    res.status(200).json({ success: true, message: `${count} dispositivos atualizados.` });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
}

async function updateDeviceSetor(req, res) {
  try {
    const { id } = req.params;
    const { setor, interval } = req.body;
    const updatedDevice = await prisma.device.update({ where: { id }, data: { setorName: setor, maintenanceIntervalDays: interval } });
    updatedDevice.setor = updatedDevice.setorName;
    res.json({ success: true, device: updatedDevice });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
}

async function updateDeviceTicket(req, res) {
  try {
    const { id } = req.params;
    const { ticketId } = req.body; 
    const updatedDevice = await prisma.device.update({ where: { id }, data: { agideskTicketId: ticketId ? String(ticketId) : null } });
    res.json({ success: true, device: updatedDevice });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
}

async function getDeviceTicket(req, res) {
  try {
    const { id } = req.params;
    const device = await prisma.device.findUnique({ where: { id }, select: { agideskTicketId: true } });
    res.json({ success: true, ticketId: device?.agideskTicketId || null });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
}

async function updatePosition(req, res) {
  try {
    const { id } = req.params;
    const { x, y } = req.body;
    await prisma.device.update({ where: { id }, data: { mapPositionX: x, mapPositionY: y } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Erro ao salvar posição' }); }
}

async function updateNetworkInfo(req, res) {
  try {
    const { id } = req.params;
    const { name, ipAddress, nobreakModel } = req.body;
    const updatedDevice = await prisma.device.update({ where: { id }, data: { name, ipAddress, nobreakModel } });
    res.json({ success: true, device: updatedDevice });
  } catch (error) { res.status(500).json({ error: 'Erro ao salvar informações de rede' }); }
}

async function getNetworkLinks(req, res) {
  try {
    const context = req.query.context || 'matriz';
    const links = await prisma.networkLink.findMany({ where: { mapContext: context } });
    res.json(links);
  } catch (error) { res.status(500).json({ error: 'Erro ao buscar links' }); }
}

async function createNetworkLink(req, res) {
  try {
    const { sourceId, targetId, sourceHandle, targetHandle, context } = req.body;
    const link = await prisma.networkLink.create({ data: { sourceId, targetId, sourceHandle, targetHandle, mapContext: context || 'matriz' } });
    res.json(link);
  } catch (error) { res.status(500).json({ error: 'Erro ao criar cabo' }); }
}

async function deleteNetworkLink(req, res) {
  try {
    await prisma.networkLink.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Erro ao remover cabo' }); }
}

async function getZones(req, res) {
  try {
    const context = req.query.context || 'matriz';
    const zones = await prisma.mapZone.findMany({ where: { mapContext: context } });
    res.json(zones);
  } catch (error) { res.status(500).json({ error: 'Erro ao buscar zonas' }); }
}

async function createZone(req, res) {
  try {
    const { name, x, y, width, height, context } = req.body;
    const zone = await prisma.mapZone.create({ data: { name, x, y, width, height, mapContext: context || 'matriz' } });
    res.json(zone);
  } catch (error) { res.status(500).json({ error: 'Erro ao criar zona' }); }
}

async function updateZone(req, res) {
  try {
    const { id } = req.params;
    const { name, x, y, width, height, context } = req.body;
    const zone = await prisma.mapZone.update({ where: { id }, data: { name, x, y, width, height, mapContext: context } });
    res.json(zone);
  } catch (error) { res.status(500).json({ error: 'Erro ao atualizar zona' }); }
}

async function deleteZone(req, res) {
  try {
    await prisma.mapZone.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Erro ao deletar zona' }); }
}

// 🟢 FUNÇÃO DE DELETAR A MÁQUINA BLINDADA
async function deleteDevice(req, res) {
  try {
    const { id } = req.params;
    console.log(`[BACKEND] Tentando remover máquina ${id}...`);

    // 1. Apaga os cabos sem dó
    await prisma.networkLink.deleteMany({ where: { OR: [{ sourceId: id }, { targetId: id }] } });

    try {
      // 2. Tenta apagar a máquina do banco
      await prisma.device.delete({ where: { id } });
      console.log(`[BACKEND] Máquina ${id} apagada com sucesso do banco!`);
      res.json({ success: true, message: 'Equipamento apagado.' });
    } catch (dbError) {
      // 3. SE O BANCO BLOQUEAR (Por causa de Preventivas), ele remove do Mapa!
      console.log(`[BACKEND] Máquina bloqueada por dependências. Removendo do mapa (Soft Delete)...`);
      await prisma.device.update({
        where: { id },
        data: { mapPositionX: null, mapPositionY: null }
      });
      res.json({ success: true, message: 'Máquina removida do mapa com sucesso (mantida no BD por histórico).' });
    }
  } catch (error) { 
    console.error(`[BACKEND] Erro crítico ao remover:`, error);
    res.status(500).json({ error: 'Erro ao processar remoção' }); 
  }
}

// 🟢 LIMPAR CABOS COM LOGS
async function clearAllLinks(req, res) {
  try {
    const context = req.query.context || 'matriz';
    console.log(`[BACKEND] Recebido pedido para limpar cabos da aba: ${context}`);
    const result = await prisma.networkLink.deleteMany({ where: { mapContext: context } });
    console.log(`[BACKEND] Sucesso! ${result.count} cabos apagados.`);
    res.json({ success: true, message: 'Ligações removidas.' });
  } catch (error) { 
    console.error(`[BACKEND] Erro ao limpar cabos:`, error);
    res.status(500).json({ error: 'Erro ao limpar ligações' }); 
  }
}

async function clearTopology(req, res) {
  try {
    const context = req.query.context || 'matriz';
    await prisma.mapZone.deleteMany({ where: { mapContext: context } });
    await prisma.networkLink.deleteMany({ where: { mapContext: context } });

    if (context === 'tractor') {
      await prisma.device.updateMany({ where: { name: { contains: 'TRC' } }, data: { mapPositionX: null, mapPositionY: null } });
    } else if (context === 'matriz') {
      await prisma.device.updateMany({ where: { NOT: { name: { contains: 'TRC' } } }, data: { mapPositionX: null, mapPositionY: null } });
    } else if (context === 'aps') {
      await prisma.device.updateMany({ where: { OR: [{ deviceType: { contains: 'ap' } }, { deviceType: { contains: 'wifi' } }] }, data: { mapPositionX: null, mapPositionY: null } });
    }

    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Erro ao limpar topologia' }); }
}

async function pingDevices(req, res) {
  try {
    const { ips } = req.body;
    if (!ips || !Array.isArray(ips)) return res.json({});
    const results = {};
    const promises = ips.map(async (ip) => {
      if (!ip || ip.trim() === '') return;
      try {
        const pingRes = await ping.promise.probe(ip, { timeout: 2 });
        results[ip] = pingRes.alive; 
      } catch(e) { results[ip] = false; }
    });
    await Promise.all(promises);
    res.json(results);
  } catch (error) { res.status(500).json({ error: 'Erro ao pingar dispositivos' }); }
}

async function createManualDevice(req, res) {
  try {
    const { name, ipAddress, deviceType } = req.body;
    const fakeGlpiId = 8000000 + Math.floor(Math.random() * 900000);
    const device = await prisma.device.create({
      data: { name, ipAddress, deviceType: deviceType || 'switch', isActive: true, glpiId: fakeGlpiId, glpiDateMod: new Date(), mapPositionX: 100, mapPositionY: 100 }
    });
    res.json({ success: true, device });
  } catch (error) { res.status(500).json({ error: 'Erro ao criar dispositivo manual' }); }
}

async function importZabbixTopology(req, res) {
  console.log(`\n[ZABBIX] Iniciando importação de topologia para a aba: ${req.body.context || 'matriz'}`);
  
  try {
    let { zabbixData, context } = req.body;
    const targetContext = context || 'matriz';

    // 1. Validação do Payload
    if (!zabbixData) {
      console.error('[ZABBIX] Erro: Nenhum dado JSON foi recebido do frontend (zabbixData undefined).');
      return res.status(400).json({ error: 'Nenhum dado recebido.' });
    }

    // Se o frontend enviou como string, tentamos transformar em Objeto
    if (typeof zabbixData === 'string') {
      try { zabbixData = JSON.parse(zabbixData); } 
      catch (e) {
        console.error('[ZABBIX] Erro ao tentar ler a string JSON:', e.message);
        return res.status(400).json({ error: 'O arquivo enviado não é um JSON válido.' });
      }
    }

    // 2. Navegação segura pela estrutura exportada do Zabbix
    const exportRoot = zabbixData.zabbix_export || zabbixData;
    if (!exportRoot.maps || !Array.isArray(exportRoot.maps) || exportRoot.maps.length === 0) {
      console.error('[ZABBIX] Erro: Estrutura incorreta. Não encontrei "zabbix_export.maps[0]". Chaves recebidas:', Object.keys(exportRoot));
      return res.status(400).json({ error: 'O JSON não contém um mapa válido do Zabbix.' });
    }

    const mapData = exportRoot.maps[0];
    console.log(`[ZABBIX] Sucesso! Lendo mapa "${mapData.name}". Processando formas e elementos...`);

    // 3. Processar Zonas (Shapes)
    if (mapData.shapes && mapData.shapes.length > 0) {
      console.log(`[ZABBIX] Recriando ${mapData.shapes.length} zonas (setores)...`);
      await prisma.mapZone.deleteMany({ where: { mapContext: targetContext } }); 
      for (const shape of mapData.shapes) {
        try { 
          await prisma.mapZone.create({ 
            data: { name: shape.text || 'Novo Setor', x: Number(shape.x), y: Number(shape.y), width: Number(shape.width), height: Number(shape.height), mapContext: targetContext } 
          }); 
        } catch (e) { console.warn('[ZABBIX] Aviso: Falha ao criar uma zona:', e.message); }
      }
    }

    // 4. Processar Dispositivos (Selements)
    const zabbixIdToDbId = {};
    if (mapData.selements && mapData.selements.length > 0) {
      console.log(`[ZABBIX] Processando ${mapData.selements.length} equipamentos...`);
      for (const sel of mapData.selements) {
        try {
          if (!sel.elements || sel.elements.length === 0 || !sel.elements[0].host) continue;
          
          const hostStr = sel.elements[0].host; 
          let searchName = hostStr;
          
          // 🟢 NOVAS REGRAS DE CATEGORIA APLICADAS AQUI
          let devType = 'Switch'; 
          if (targetContext === 'tractor') {
             if (!searchName.toUpperCase().includes('TRC')) searchName = `TRC ${searchName}`;
          } else if (targetContext === 'aps') {
             devType = 'Access Point'; 
          }

          let device = await prisma.device.findFirst({ 
            where: { OR: [ { ipAddress: { contains: hostStr } }, { name: { contains: searchName } } ] } 
          });

          if (!device) {
            const safeGlpiId = 9000000 + Number(sel.selementid); 
            device = await prisma.device.create({
              data: { 
                name: targetContext === 'aps' ? `AP ${hostStr}` : `SW ${searchName}`, 
                ipAddress: hostStr, 
                deviceType: devType, // 🟢 Categoria correta!
                isActive: true, 
                mapPositionX: Number(sel.x), 
                mapPositionY: Number(sel.y), 
                glpiId: safeGlpiId, 
                glpiDateMod: new Date() 
              }
            });
          } else {
            device = await prisma.device.update({
              where: { id: device.id }, 
              data: { 
                mapPositionX: Number(sel.x), 
                mapPositionY: Number(sel.y), 
                deviceType: targetContext === 'aps' ? 'Access Point' : (device.deviceType === 'Outros' ? 'Switch' : device.deviceType) 
              }
            });
          }
          zabbixIdToDbId[sel.selementid] = device.id; 
        } catch (errInner) { 
          console.error(`[ZABBIX] Erro ao processar o elemento ${sel.selementid}:`, errInner.message); 
        }
      }
    }

    // 5. Processar Ligações (Links)
    if (mapData.links && mapData.links.length > 0) {
      console.log(`[ZABBIX] Recriando ${mapData.links.length} ligações (cabos)...`);
      await prisma.networkLink.deleteMany({ where: { mapContext: targetContext } }); 
      for (const link of mapData.links) {
        const sourceDbId = zabbixIdToDbId[link.selementid1];
        const targetDbId = zabbixIdToDbId[link.selementid2];
        if (sourceDbId && targetDbId && sourceDbId !== targetDbId) {
          try { 
            await prisma.networkLink.create({ 
              data: { sourceId: sourceDbId, targetId: targetDbId, sourceHandle: 's-bottom', targetHandle: 't-top', mapContext: targetContext } 
            }); 
          } catch(e) { console.warn('[ZABBIX] Aviso: Falha ao criar link:', e.message); }
        }
      }
    }

    console.log('[ZABBIX] Importação concluída com sucesso!');
    res.json({ success: true });

  } catch (error) { 
    // 🟢 O FIM DO SILÊNCIO: Agora ele grita no terminal se algo falhar!
    console.error('\n❌ [ZABBIX] ERRO FATAL NA IMPORTAÇÃO:', error);
    res.status(500).json({ error: 'Erro interno ao processar o arquivo JSON.' }); 
  }
}

async function updateDeviceCategory(req, res) {
  try {
    const { id } = req.params;
    const { category } = req.body;
    const updatedDevice = await prisma.device.update({
      where: { id },
      data: { deviceType: category }
    });
    res.json({ success: true, device: updatedDevice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { 
  getAllDevices, getDeviceById, cleanupDefaultValues, bulkUpdateSetors, updateDeviceSetor,
  updateDeviceTicket, getDeviceTicket, updatePosition, updateNetworkInfo, getNetworkLinks, 
  createNetworkLink, deleteNetworkLink, getZones, createZone, updateZone, deleteZone, 
  clearTopology, importZabbixTopology, deleteDevice, clearAllLinks, createManualDevice, pingDevices, updateDeviceCategory
};