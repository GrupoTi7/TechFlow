// src/routes/device.routes.js
const express = require('express');
const router = express.Router();

// --- A CORREÇÃO ESTÁ AQUI ---
// Faltava importar o controlador
const deviceController = require('../controllers/device.controller');
// ----------------------------

const { authenticateToken } = require('../middleware/auth.middleware');

// Suas rotas existentes (que já funcionavam)
router.get('/devices', authenticateToken, deviceController.getAllDevices);
router.get('/devices/:id', authenticateToken, deviceController.getDeviceById);


router.post(
  '/devices/admin/cleanup-defaults', 
  authenticateToken, 
  deviceController.cleanupDefaultValues
);

// --- NOVA ROTA DE ADMIN PARA ATUALIZAÇÃO EM MASSA ---
router.patch(
  '/devices/bulk-setor',
  authenticateToken,
  deviceController.bulkUpdateSetors
);

module.exports = router;