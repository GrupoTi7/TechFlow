// src/controllers/user.controller.js
const { prisma } = require('../config/prismaClient');

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Validação básica do ID
    const userId = Number(id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    // 2. Verificar se o usuário existe
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userExists) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // 3. Tentar deletar
    await prisma.user.delete({
      where: { id: userId }
    });

    return res.status(200).json({ message: 'Usuário excluído com sucesso!' });

  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    
    // Tratamento de erro específico do Prisma (Foreign Key)
    // Ex: Tentar apagar um usuário que tem crachás ou preventivas vinculadas
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Não é possível excluir este usuário pois ele possui registros vinculados (ex: preventivas/histórico).' 
      });
    }

    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

module.exports = { deleteUser };
