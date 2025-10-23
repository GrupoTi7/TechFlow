const { Router } = require('express');
const { getStats } = require('../controllers/dashboard.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const router = Router();

// Apenas uma rota para buscar todas as estatísticas
router.get('/dashboard/stats', authenticateToken, getStats);

module.exports = router;