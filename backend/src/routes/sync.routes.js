// src/routes/sync.routes.js
const express = require('express');
const router = express.Router();
const { syncGlpiDevices } = require('../services/glpi.service.js');
const { authenticateToken } = require('../middleware/auth.middleware');

// Endpoint para disparar a sincronização manualmente (ex: por um botão no admin)
router.post('/sync/glpi', authenticateToken, async (req, res) => {
  try {
    const result = await syncGlpiDevices();
    res.status(200).json({ success: true, message: 'Sincronização concluída!', ...result });
  } catch (error) {
    console.error('Erro na rota de sync:', error);
    res.status(500).json({ success: false, message: 'Erro ao sincronizar.', error: error.message });
  }
});

module.exports = router;