// src/routes/preventive.routes.js

const express = require('express');
const router = express.Router();
const preventiveController = require('../controllers/preventive.controller');
const agideskController = require('../controllers/agidesk.controller'); 
const { authenticateToken } = require('../middleware/auth.middleware'); 

// --- ROTAS DE REGISTRO INTERNO (TechFlow) ---

// Rota para LISTAR (GET)
router.get(
  '/devices/:deviceId/preventives', 
  authenticateToken, 
  preventiveController.getPreventivesByDevice
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

// 1. Cria o ticket no Agidesk (e devolve o ID)
router.post(
  '/agidesk/start', 
  authenticateToken, 
  agideskController.startTicket
);

// 2. Dá o Play no cronômetro do Agidesk
router.post(
  '/agidesk/play', 
  authenticateToken, 
  agideskController.playTicket
);

// 3. Encerra o ticket no Agidesk
router.post(
  '/agidesk/finish', 
  authenticateToken, 
  agideskController.finishTicket
);

module.exports = router;