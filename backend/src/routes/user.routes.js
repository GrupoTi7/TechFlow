// src/routes/user.routes.js
const { Router } = require('express');
const { deleteUser } = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware'); // Proteção

const router = Router();

// Rota: DELETE /api/users/:id
// Exemplo: /api/users/5
router.delete('/users/:id', authenticateToken, deleteUser);

module.exports = router;
