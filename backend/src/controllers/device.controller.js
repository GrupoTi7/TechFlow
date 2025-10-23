const deviceService = require('../services/device.service');

async function getAllDevices(req, res) {
  try {
    // 1. Passa todos os query parameters (ex: ?deviceType=...) para o serviço
    const devices = await deviceService.findAllDevices(req.query); 
    res.status(200).json({ success: true, count: devices.length, devices: devices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar dispositivos.', error: error.message });
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