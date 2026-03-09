// src/routes/reports.routes.js
const { Router } = require('express');
const { getHistoryReport } = require('../controllers/reports.controller');
// 1. ATUALIZADO: Importando os novos controllers (Sector e Status)
const { 
  getTechnicianReport, 
  getTopDevicesReport,
  getSectorReport, // <--- NOVO
  getStatusReport  // <--- NOVO
} = require('../controllers/reports.controller');

const { authenticateToken } = require('../middleware/auth.middleware');
const router = Router();
const { sendNotificationEmail } = require('../services/notification.service');

// --- ROTAS EXISTENTES ---

// Rota para o gráfico de técnicos
router.get('/reports/by-technician', authenticateToken, getTechnicianReport);

// Rota para o gráfico de top 10 dispositivos
router.get('/reports/top-devices', authenticateToken, getTopDevicesReport);

// --- NOVAS ROTAS ADICIONADAS ---

// Rota para o gráfico de Equipamentos por Setor
router.get('/reports/by-sector', authenticateToken, getSectorReport);

// Rota para o gráfico de Status de Conformidade (Em dia / Vencido)
router.get('/reports/status', authenticateToken, getStatusReport);

// [NOVA ROTA]
router.get('/reports/history', authenticateToken, getHistoryReport);

/* --- ROTA DE TESTE MANUAL DE E-MAIL (MANTIDA COMO ESTAVA) ---
router.post('/reports/test-notification', authenticateToken, async (req, res) => {
  try {
    console.log('Disparando envio de notificação manualmente...');

    // Chama a função de notificação e espera ela terminar
    await sendNotificationEmail(); 

    res.status(200).json({ 
      success: true, 
      message: 'Tentativa de envio de e-mail disparada. Verifique o console do backend.' 
    });

  } catch (error) {
    console.error('Erro ao disparar notificação manual:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor ao tentar enviar notificação.', 
      error: error.message 
    });
  }
});
*/ 

module.exports = router;