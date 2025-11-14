// src/routes/sync.routes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware.js');

// 1. REMOVA a importação do serviço (não será executado aqui)
// const { syncGlpiDevices } = require('../services/glpi.service.js');

// 2. IMPORTE a fila (que criámos no config)
const { syncQueue } = require('../config/queue.js');

// Endpoint para disparar a sincronização manualmente
// (agora ele apenas "agenda" a tarefa)
router.post('/sync/glpi', authenticateToken, async (req, res) => {
  try {
    // 3. ADICIONE o trabalho à fila em vez de executá-lo
    const job = await syncQueue.add('manual-glpi-sync', { 
      requestedBy: req.user.id // Exemplo de como passar dados do middleware
    });

    // 4. RESPONDA IMEDIATAMENTE com 202 (Aceito)
    // O Nginx e o Postman vão receber isto em menos de 1 segundo.
    res.status(202).json({ 
      success: true, 
      message: 'Sincronização solicitada. O processo está rodando em segundo plano.',
      jobId: job.id // Opcional: envie o ID para o frontend poder consultar
    });

  } catch (error) {
    // 5. O erro agora é se o REDIS falhar
    console.error('Erro ao adicionar job na fila de sync:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao agendar a sincronização.', 
      error: error.message 
    });
  }
});

module.exports = router;