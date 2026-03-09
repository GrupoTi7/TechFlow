const reportsService = require('../services/reports.service');

// 1. Relatório de Técnicos (Já existia)
async function getTechnicianReport(req, res) {
  try {
    const data = await reportsService.getPreventivesByTechnician();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Erro no getTechnicianReport:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// 2. Relatório de Top Dispositivos (Já existia)
async function getTopDevicesReport(req, res) {
  try {
    const data = await reportsService.getTopDevicesByMaintenance();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Erro no getTopDevicesReport:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// 3. [NOVO] Relatório de Setores
async function getSectorReport(req, res) {
  try {
    const data = await reportsService.getDevicesBySector();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Erro no getSectorReport:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// 4. [NOVO] Relatório de Status (Compliance)
async function getStatusReport(req, res) {
  try {
    const data = await reportsService.getComplianceStatus();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Erro no getStatusReport:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
async function getHistoryReport(req, res) {
  try {
    const data = await reportsService.getMaintenanceHistory();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Erro history report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// --- IMPORTANTE: EXPORTAR TODAS AS 4 FUNÇÕES ---
module.exports = { 
    getTechnicianReport, 
    getTopDevicesReport,
    getSectorReport, // <--- Se faltar isso, dá erro na rota
    getStatusReport,  // <--- Se faltar isso, dá erro na rota
    getHistoryReport  // <--- Novo relatório de histórico
};