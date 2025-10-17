const dashboardService = require('../services/dashboard.service');

async function getStats(req, res) {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.status(200).json({ success: true, stats: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar estatísticas.', error: error.message });
  }
}

module.exports = { getStats };