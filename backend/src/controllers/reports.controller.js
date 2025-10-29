// src/controllers/reports.controller.js
const reportsService = require('../services/reports.service');

async function getTechnicianReport(req, res) {
  try {
    const data = await reportsService.getPreventivesByTechnician();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Erro no getTechnicianReport:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getTopDevicesReport(req, res) {
  try {
    const data = await reportsService.getTopDevicesByMaintenance();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Erro no getTopDevicesReport:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { getTechnicianReport, getTopDevicesReport };