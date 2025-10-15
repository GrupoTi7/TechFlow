const preventiveService = require('../services/preventive.service');

async function getPreventivesForDevice(req, res) {
  try {
    const { deviceId } = req.params;
    const preventives = await preventiveService.findPreventivesByDevice(deviceId);
    res.status(200).json({ success: true, data: preventives });
  } catch (error) {
    if (error.code === 'DEVICE_NOT_FOUND') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Erro ao obter preventivas', error: error.message });
  }
}

async function createPreventiveForDevice(req, res) {
  try {
    const { deviceId } = req.params;
    const created = await preventiveService.addPreventive(deviceId, req.body);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error.code === 'DEVICE_NOT_FOUND') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.code === 'VALIDATION_ERROR') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Erro ao criar preventiva', error: error.message });
  }
}

module.exports = { getPreventivesForDevice, createPreventiveForDevice };


