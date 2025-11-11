// src/controllers/preventive.controller.js
const preventiveService = require('../services/preventive.service');

// Função para criar uma nova preventiva
async function createPreventive(req, res) {
  try {
    const { deviceId } = req.params;

    // 1. LEIA APENAS A DATA E AS NOTAS
    const { date, notes } = req.body; 

    // 2. LEIA O NOME DO USUÁRIO DO TOKEN
    const technicianName = req.user.username; 

    if (!date || !technicianName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Data e técnico (do token) são obrigatórios.' 
      });
    }

    // 3. CONSTRUA O OBJETO DE DADOS
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
    // --- MELHORIA: Adicionado log de erro ---
    console.error('Erro no controller createPreventive:', error);
    // --- FIM DA MELHORIA ---

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

    // --- CORREÇÃO AQUI ---
    // Alterado de findPreventivesForDevice para findPreventivesByDevice
    const preventives = await preventiveService.findPreventivesByDevice(deviceId); 
    // --- FIM DA CORREÇÃO ---

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

// Nova função para apagar
async function deletePreventive(req, res) {
  try {
    const { id } = req.params; // Pega o ID da preventiva (ex: /api/preventives/abc123)
    await preventiveService.deletePreventive(id);
    res.status(200).json({ success: true, message: 'Preventiva apagada com sucesso.' });
  } catch (error) {
    console.error('Erro no controller deletePreventive:', error);
    res.status(500).json({ success: false, message: 'Erro ao apagar preventiva.', error: error.message });
  }
}

module.exports = { 
  createPreventive,
  getPreventivesByDevice,
  deletePreventive
};