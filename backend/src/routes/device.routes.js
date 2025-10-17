// src/routes/device.routes.js
const { Router } = require('express');
const { getAllDevices, getDeviceById } = require('../controllers/device.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const router = Router();

// Rota para buscar TODOS os dispositivos (para a nossa lista)
router.get('/devices', authenticateToken, getAllDevices);

// Rota para buscar UM dispositivo pelo seu ID (para a futura página de detalhes)
router.get('/devices/:id', authenticateToken, getDeviceById);

module.exports = router;