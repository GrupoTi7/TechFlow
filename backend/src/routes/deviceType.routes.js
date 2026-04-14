const express = require('express');
const router = express.Router();
const deviceTypeController = require('../controllers/deviceType.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.get('/', authenticateToken, deviceTypeController.listDeviceTypes);
router.post('/', authenticateToken, deviceTypeController.createDeviceType);
router.put('/:id', authenticateToken, deviceTypeController.updateDeviceType);
router.delete('/:id', authenticateToken, deviceTypeController.deleteDeviceType);

module.exports = router;