const { Router } = require('express');
const { getAllDevices } = require('../controllers/device.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const router = Router();

router.get('/devices', authenticateToken, getAllDevices);

module.exports = router;