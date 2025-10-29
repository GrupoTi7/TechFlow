// src/routes/reports.routes.js
const { Router } = require('express');
const { getTechnicianReport, getTopDevicesReport } = require('../controllers/reports.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const router = Router();

// Rota para o gráfico de técnicos
router.get('/reports/by-technician', authenticateToken, getTechnicianReport);

// Rota para o gráfico de top 10 dispositivos
router.get('/reports/top-devices', authenticateToken, getTopDevicesReport);

module.exports = router;