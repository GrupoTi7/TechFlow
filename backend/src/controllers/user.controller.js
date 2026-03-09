const userService = require('../services/user.service');

const listUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    // Retorna { success: true, users: [...] } para manter padrão da sua API
    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao buscar usuários.' });
  }
};

module.exports = {
  listUsers
};