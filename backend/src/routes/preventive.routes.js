// src/routes/preventive.routes.js
const { Router } = require('express');
const { getPreventivesForDevice, createPreventiveForDevice } = require('../controllers/preventive.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const router = Router();

router.get('/devices/:deviceId/preventives', authenticateToken, getPreventivesForDevice);
router.post('/devices/:deviceId/preventives', authenticateToken, createPreventiveForDevice);

module.exports = router;