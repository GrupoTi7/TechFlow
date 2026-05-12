// src/controllers/preventive.controller.js
const preventiveService = require('../services/preventive.service');
const { prisma } = require('../config/prismaClient'); // 🟢 ADICIONADO: Importação do Prisma para acessar as outras tabelas

async function createPreventive(req, res) {
  try {
    const { deviceId } = req.params;
    const { date, notes } = req.body; 
    const technicianName = req.user.username; 

    if (!date || !technicianName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Data e técnico (do token) são obrigatórios.' 
      });
    }

    const preventiveData = {
      date: new Date(date),
      technician: technicianName,
      notes: notes
    };

    // 1. Cria a preventiva no histórico
    const newPreventive = await preventiveService.addPreventive(deviceId, preventiveData);
    
    // 2. Atualiza a data da última preventiva no próprio Dispositivo
    await prisma.device.update({
        where: { id: deviceId },
        data: { lastPreventiveDate: new Date(date) } // Atualiza para a data que o técnico preencheu
    });

    // 3. Dá baixa automática se a máquina estiver pendente num Plano de Ação
    await prisma.actionPlanAssignment.updateMany({
        where: { 
            deviceId: deviceId,
            status: 'PENDING' 
        },
        data: { 
            status: 'DONE',
            completedAt: new Date(date)
        }
    });

    res.status(201).json({ 
      success: true, 
      message: 'Preventiva registada e baixa efetuada com sucesso!', 
      preventive: newPreventive 
    });

  } catch (error) {
    console.error('Erro no controller createPreventive:', error);
    res.status(500).json({ 
        success: false, 
        message: 'Erro ao criar preventiva.', 
        error: error.message 
    });
  }
}

async function getPreventivesByDevice(req, res) {
  try {
    const { deviceId } = req.params;
    const preventives = await preventiveService.findPreventivesByDevice(deviceId); 
    res.status(200).json({ success: true, preventives });
  } catch (error) {
    console.error('Erro no controller getPreventivesByDevice:', error); 
    res.status(500).json({ 
        success: false, 
        message: 'Erro ao buscar preventivas.', 
        error: error.message 
    });
  }
}

// 🟢 Função: Busca o histórico completo de todas as máquinas
async function getAllPreventives(req, res) {
  try {
    const preventives = await preventiveService.findAllPreventives();
    res.status(200).json({ success: true, preventives });
  } catch (error) {
    console.error('Erro no controller getAllPreventives:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar todo o histórico.', error: error.message });
  }
}

// 🟢 A MÁGICA FOI INJETADA AQUI
async function deletePreventive(req, res) {
  try {
    const { id } = req.params; 

    // 1. Busca a preventiva antes de apagar para descobrirmos de qual máquina ela é
    const prevToDelete = await prisma.preventive.findUnique({
      where: { id }
    });

    if (!prevToDelete) {
      return res.status(404).json({ success: false, message: 'Preventiva não encontrada.' });
    }

    const deviceId = prevToDelete.deviceId;

    // 2. Apaga a preventiva do histórico
    await preventiveService.deletePreventive(id);

    // 3. Encontra as atribuições dessa máquina em campanhas que AINDA ESTÃO ATIVAS
    const assignmentsToRevert = await prisma.actionPlanAssignment.findMany({
      where: {
        deviceId: deviceId,
        status: { in: ['DONE', 'COMPLETED'] }, // Pega se estiver como concluído
        plan: { status: { not: 'COMPLETED' } } // Apenas de campanhas que estão rodando
      }
    });

    // 4. Devolve a máquina para a fila (Volta para PENDING e limpa a data de conclusão)
    for (const assignment of assignmentsToRevert) {
      await prisma.actionPlanAssignment.update({
        where: { id: assignment.id },
        data: { status: 'PENDING', completedAt: null }
      });
    }

    // 5. Recalcula a data da "Última Preventiva" no cadastro da máquina
    // Busca qual foi a última preventiva que restou no histórico dessa máquina
    const lastPrev = await prisma.preventive.findFirst({
      where: { deviceId: deviceId },
      orderBy: { date: 'desc' }
    });

    // Atualiza a máquina (se não sobrou nenhuma preventiva, o campo volta a ficar em branco/null)
    await prisma.device.update({
      where: { id: deviceId },
      data: { lastPreventiveDate: lastPrev ? lastPrev.date : null }
    });

    res.status(200).json({ success: true, message: 'Preventiva apagada, máquina devolvida à fila e data recalculada com sucesso!' });
  } catch (error) {
    console.error('Erro no controller deletePreventive:', error);
    res.status(500).json({ success: false, message: 'Erro ao apagar preventiva.', error: error.message });
  }
}

async function findAllPreventives() {
  return await prisma.preventive.findMany({
    include: {
      device: true // Puxa os dados da máquina junto para a tabela do frontend!
    },
    orderBy: {
      date: 'desc' // Ordena da mais recente para a mais antiga
    }
  });
}

module.exports = { 
  createPreventive,
  getPreventivesByDevice,
  getAllPreventives, 
  deletePreventive,
  findAllPreventives
};