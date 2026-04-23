// src/routes/preventive.routes.js
const express = require('express');
const router = express.Router();
const preventiveController = require('../controllers/preventive.controller');
const agideskController = require('../controllers/agidesk.controller'); 
const { authenticateToken } = require('../middleware/auth.middleware'); 

// --- ROTAS DE REGISTRO INTERNO (TechFlow) ---

// Rota para LISTAR preventivas de uma máquina específica
router.get(
  '/devices/:deviceId/preventives', 
  authenticateToken, 
  preventiveController.getPreventivesByDevice
);

// 🟢 NOVA ROTA: Listar TODAS as preventivas (Histórico Global)
router.get(
  '/preventives', 
  authenticateToken, 
  preventiveController.getAllPreventives
);

// Rota para CRIAR (POST) registro no banco local
router.post(
  '/devices/:deviceId/preventives', 
  authenticateToken, 
  preventiveController.createPreventive
);

// Rota DELETE (ID da preventiva)
router.delete(
  '/preventives/:id', 
  authenticateToken, 
  preventiveController.deletePreventive
);

// --- 🚀 INTEGRAÇÃO AGIDESK ---
router.post('/agidesk/start', authenticateToken, agideskController.startTicket);
router.post('/agidesk/play', authenticateToken, agideskController.playTicket);
router.post('/agidesk/finish', authenticateToken, agideskController.finishTicket);

module.exports = router;