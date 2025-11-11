// src/routes/preventive.routes.js

const express = require('express');
const router = express.Router();
const preventiveController = require('../controllers/preventive.controller');
const { authenticateToken } = require('../middleware/auth.middleware'); 

// Rota para LISTAR (GET) - Verifique o nome desta função
router.get(
  '/devices/:deviceId/preventives', 
  authenticateToken, 
  preventiveController.getPreventivesByDevice // <-- O erro está provavelmente aqui
);

// Rota para CRIAR (POST) - Verifique o nome desta função
router.post(
  '/devices/:deviceId/preventives', 
  authenticateToken, 
  preventiveController.createPreventive // <-- Verifique esta também
);

// --- NOVA ROTA DELETE ---
// (Note que o ID aqui é o da PREVENTIVA, não do dispositivo)
router.delete(
  '/preventives/:id', 
  authenticateToken, 
  preventiveController.deletePreventive
);
// -----------------------

module.exports = router;