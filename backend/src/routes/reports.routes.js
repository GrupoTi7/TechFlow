// src/routes/reports.routes.js
const { Router } = require('express');
const { getTechnicianReport, getTopDevicesReport } = require('../controllers/reports.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const router = Router();
const { sendNotificationEmail } = require('../services/notification.service');

// Rota para o gráfico de técnicos
router.get('/reports/by-technician', authenticateToken, getTechnicianReport);

// Rota para o gráfico de top 10 dispositivos
router.get('/reports/top-devices', authenticateToken, getTopDevicesReport);

/* --- ROTA DE TESTE MANUAL DE E-MAIL ---
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