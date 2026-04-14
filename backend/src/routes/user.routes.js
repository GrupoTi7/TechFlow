const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// Importa o módulo completo
const authModule = require('../middleware/auth.middleware');

// CORREÇÃO: O log confirmou que a função se chama 'authenticateToken'
const authMiddleware = authModule.authenticateToken;

// Rota GET /api/users
// Verifica se o controller e o middleware são funções antes de passar para o router
if (typeof authMiddleware !== 'function') {
    console.error("ERRO FATAL: authMiddleware não é uma função. Verifique auth.middleware.js");
}
if (typeof userController.listUsers !== 'function') {
    console.error("ERRO FATAL: userController.listUsers não é uma função. Verifique user.controller.js");
}

router.get('/', authMiddleware, userController.listUsers);

module.exports = router;