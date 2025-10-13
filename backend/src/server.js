// src/server.js
const express = require('express');
require('dotenv').config();

const { connectDB } = require('./config/prismaClient'); // A sua função de conexão
const syncRoutes = require('./routes/sync.routes');
// const authRoutes = require('./routes/auth.routes'); // Desativado por enquanto

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Esta linha define o prefixo /api para as rotas de sincronização
app.use('/api', syncRoutes);

// app.use('/api/auth', authRoutes); // Desativado por enquanto

// Função de Início
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Servidor iniciado com sucesso na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();