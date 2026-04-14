const express = require('express');
const router = express.Router();
const sectorController = require('../controllers/sector.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Listar todos (GET /api/sectors)
router.get('/', authenticateToken, sectorController.listSectors);

// Criar novo (POST /api/sectors)
router.post('/', authenticateToken, sectorController.createSector);

// Atualizar (PUT /api/sectors/:id)
router.put('/:id', authenticateToken, sectorController.updateSector);

// Deletar (DELETE /api/sectors/:id)
router.delete('/:id', authenticateToken, sectorController.deleteSector);

module.exports = router;