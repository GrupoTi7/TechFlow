// src/controllers/preventive.controller.js
const preventiveService = require('../services/preventive.service');

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

    const newPreventive = await preventiveService.addPreventive(deviceId, preventiveData);
    
    res.status(201).json({ 
      success: true, 
      message: 'Preventiva registada com sucesso!', 
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

// 🟢 NOVA FUNÇÃO: Busca o histórico completo de todas as máquinas
async function getAllPreventives(req, res) {
  try {
    const preventives = await preventiveService.findAllPreventives();
    res.status(200).json({ success: true, preventives });
  } catch (error) {
    console.error('Erro no controller getAllPreventives:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar todo o histórico.', error: error.message });
  }
}

async function deletePreventive(req, res) {
  try {
    const { id } = req.params; 
    await preventiveService.deletePreventive(id);
    res.status(200).json({ success: true, message: 'Preventiva apagada com sucesso.' });
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