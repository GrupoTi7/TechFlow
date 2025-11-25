// src/routes/auth.routes.js
const { Router } = require('express');
const { register, login } = require('../controllers/auth.controller');
const router = Router();

router.post('/register', register);
router.post('/login', authController.login);
router.post('/request-reset', authController.requestPasswordReset); 
router.post('/reset-password', authController.resetPassword);

module.exports = router;