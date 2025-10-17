// src/controllers/preventive.controller.js
const preventiveService = require('../services/preventive.service');

async function getPreventivesForDevice(req, res) {
  try {
    const { deviceId } = req.params;
    const preventives = await preventiveService.findPreventivesByDevice(deviceId);
    res.status(200).json({ success: true, preventives });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function createPreventiveForDevice(req, res) {
  try {
    const { deviceId } = req.params;
    const newPreventive = await preventiveService.addPreventive(deviceId, req.body);
    res.status(201).json({ success: true, preventive: newPreventive });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getPreventivesForDevice, createPreventiveForDevice };