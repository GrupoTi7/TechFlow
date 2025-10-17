const deviceService = require('../services/device.service');

async function getAllDevices(req, res) {
  try {
    // 1. Chama o serviço para buscar os dispositivos
    const devices = await deviceService.findAllDevices();

    // 2. Envia uma resposta de sucesso com os dados
    res.status(200).json({ 
      success: true, 
      count: devices.length, 
      devices: devices 
    });
  } catch (error) {
    // Em caso de erro no serviço, envia uma resposta de erro
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar dispositivos.', 
      error: error.message 
    });
  }
}

// Adiciona a nova função de busca por ID
async function getDeviceById(req, res) {
  try {
    const { id } = req.params; // Pega o ID que vem do URL
    const device = await deviceService.findDeviceById(id);
    res.status(200).json({ success: true, device: device });
  } catch (error) {
    // Se o serviço der erro (ex: "Dispositivo não encontrado"), envia 404
    res.status(404).json({ success: false, message: error.message });
  }
}

module.exports = { 
  getAllDevices,
  getDeviceById 
};