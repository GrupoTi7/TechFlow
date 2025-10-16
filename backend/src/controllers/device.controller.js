const deviceService = require('../services/device.service');

async function getAllDevices(req, res) {
  try {
    const devices = await deviceService.findAllDevices();
    res.status(200).json({ success: true, count: devices.length, devices: devices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar dispositivos.', error: error.message });
  }
}

module.exports = { getAllDevices };