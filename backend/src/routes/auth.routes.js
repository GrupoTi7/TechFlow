const express = require('express');
const router = express.Router();

// Importa as funções diretamente (Destructuring)
const { 
  login, 
  requestPasswordReset, 
  resetPassword,
  register
} = require('../controllers/auth.controller');

// Rotas
router.post('/login', login);
router.post('/register', register);
router.post('/request-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Se você tinha uma rota de registro antes e quer mantê-la (embora não esteja no código que me mandou):
// router.post('/register', register); 

module.exports = router;