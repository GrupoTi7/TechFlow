// src/config/prismaClient.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function connectDB() {
  try {
    await prisma.$connect();
    console.log('Conectado com sucesso à base de dados.');
  } catch (error) {
    console.error('Falha na conexão com DB:', error);
    process.exit(1);
  }
}

// IMPORTANTE: Exporte 'prisma' (a instância) e 'connectDB'
module.exports = { prisma, connectDB };