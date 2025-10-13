// src/routes/sync.routes.js
const express = require('express');
const syncController = require('../controllers/sync.controller');
// const { authenticateToken } = require('../middleware/auth.middleware'); // Desativado para o teste

const router = express.Router();

// O caminho aqui deve ser '/sync' para combinar com o prefixo '/api' do server.js
// Juntando os dois, o URL final fica /api/sync
router.post('/sync', /* authenticateToken, */ syncController.handleSync); // Guardião desativado para o teste

module.exports = router;