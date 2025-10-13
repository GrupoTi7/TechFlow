// src/config/prismaClient.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function connectDB() {
  try {
    await prisma.$connect();
    console.log('Conectado com sucesso à base de dados.');
  } catch (error) {
    console.error('Não foi possível conectar à base de dados:', error);
    process.exit(1);
  }
}

async function disconnectDB() {
  await prisma.$disconnect();
}

// Garanta que está a exportar o objeto 'prisma'
module.exports = { prisma, connectDB, disconnectDB };