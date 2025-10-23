// src/controllers/dashboard.controller.js
const dashboardService = require('../services/dashboard.service');

// Esta função já existia
async function getStats(req, res) {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.status(200).json({ success: true, stats: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar estatísticas.', error: error.message });
  }
}

// --- FUNÇÃO QUE ESTAVA EM FALTA ---
// Esta função chama o serviço do gráfico
async function getChartData(req, res) {
  try {
    const data = await dashboardService.getDeviceTypeChartData();
    res.status(200).json({ success: true, data: data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar dados do gráfico.', error: error.message });
  }
}
// ---------------------------------

module.exports = { 
  getStats,
  getChartData // Agora esta função existe e pode ser exportada
};