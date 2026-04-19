// src/routes/device.routes.js
const express = require('express');
const router = express.Router();

const deviceController = require('../controllers/device.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// ========================================================
// 1. ROTAS ESTÁTICAS (Sem :id) - Devem vir PRIMEIRO!
// ========================================================
router.get('/devices', authenticateToken, deviceController.getAllDevices);
router.post('/devices/admin/cleanup-defaults', authenticateToken, deviceController.cleanupDefaultValues);
router.patch('/devices/bulk-setor', authenticateToken, deviceController.bulkUpdateSetors);

// 🟢 Zonas e Zabbix
router.get('/devices/zones', authenticateToken, deviceController.getZones);
router.post('/devices/zones', authenticateToken, deviceController.createZone);
router.post('/devices/zabbix/import', authenticateToken, deviceController.importZabbixTopology);
router.delete('/devices/topology/clear', authenticateToken, deviceController.clearTopology); 

// 🟢 Cabos do Mapa
router.get('/devices/links', authenticateToken, deviceController.getNetworkLinks);
router.post('/devices/links', authenticateToken, deviceController.createNetworkLink);
router.delete('/devices/topology/links/clear', authenticateToken, deviceController.clearAllLinks);

// 🟢 Ping e Dispositivos Manuais
router.post('/devices/ping', authenticateToken, deviceController.pingDevices);
router.post('/devices/manual', authenticateToken, deviceController.createManualDevice);


// ========================================================
// 2. ROTAS DINÂMICAS (Com :id) - Ficam SEMPRE NO FINAL
// ========================================================

// 🟢 Zonas e Cabos Dinâmicos
router.put('/devices/zones/:id', authenticateToken, deviceController.updateZone);
router.delete('/devices/zones/:id', authenticateToken, deviceController.deleteZone);
router.delete('/devices/links/:id', authenticateToken, deviceController.deleteNetworkLink);

// 🟢 Dispositivos Dinâmicos (Sempre as últimas)
router.put('/devices/:id/position', authenticateToken, deviceController.updatePosition);
router.patch('/devices/:id/network', authenticateToken, deviceController.updateNetworkInfo);
router.patch('/devices/:id/setor', authenticateToken, deviceController.updateDeviceSetor);
router.patch('/devices/:id/category', authenticateToken, deviceController.updateDeviceCategory); // 🟢 NOVA ROTA AQUI
router.patch('/devices/:id/ticket', authenticateToken, deviceController.updateDeviceTicket);
router.get('/devices/:id/ticket', authenticateToken, deviceController.getDeviceTicket);
router.get('/devices/:id', authenticateToken, deviceController.getDeviceById);
router.delete('/devices/:id', authenticateToken, deviceController.deleteDevice);

module.exports = router;