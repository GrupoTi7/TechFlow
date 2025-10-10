const express = require('express');
const syncController = require('../controllers/sync.controller');

const router = express.Router();

/**
 * Rota para sincronização de dispositivos
 * POST /api/sync
 * 
 * Body:
 * {
 *   "force": boolean (opcional) - Força a sincronização mesmo se já foi feita recentemente
 * }
 * 
 * Response:
 * {
 *   "success": boolean,
 *   "message": string,
 *   "data": {
 *     "devicesProcessed": number,
 *     "devicesCreated": number,
 *     "devicesUpdated": number,
 *     "errors": array,
 *     "timestamp": string
 *   }
 * }
 */
// Altere de '/' para '/sync'
router.post('/sync', syncController.handleSync);

/**
 * Rota para obter status da sincronização
 * GET /api/sync/status
 * 
 * Response:
 * {
 *   "success": boolean,
 *   "message": string,
 *   "data": {
 *     "lastSync": string|null,
 *     "nextSync": string|null,
 *     "isSyncNeeded": boolean
 *   }
 * }
 */
router.get('/status', syncController.getSyncStatus);

module.exports = router;
