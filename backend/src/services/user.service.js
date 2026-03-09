const { prisma } = require('../config/prismaClient');

const getAllUsers = async () => {
  try {
    // Tenta acessar prisma.user (padrão) ou prisma.users (caso o map tenha mudado)
    const userModel = prisma.user || prisma.users;

    if (!userModel) {
      throw new Error('Modelo de Usuário (user/users) não encontrado no Prisma Client.');
    }

    const users = await userModel.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
      },
    });
    return users;
  } catch (error) {
    console.error("Erro no user.service:", error);
    throw error;
  }
};

const getUserById = async (id) => {
  const userModel = prisma.user || prisma.users;
  return await userModel.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true }
  });
};

module.exports = {
  getAllUsers,
  getUserById
};