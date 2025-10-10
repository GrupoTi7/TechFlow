// src/controllers/auth.controller.js
const authService = require('../services/auth.service');

async function register(req, res) {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json({ success: true, message: 'Usuário registado com sucesso!', user });
  } catch (error) {
    if (error.message.includes('já registado')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
}
async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username e password são obrigatórios.' });
    }
    const result = await authService.loginUser(username, password);
    res.status(200).json({ success: true, message: 'Autenticação bem-sucedida!', token: result.token });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
}
module.exports = { register, login };