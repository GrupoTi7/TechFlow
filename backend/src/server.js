// src/server.js

const express = require('express');
const cors = require('cors'); // <-- 1. IMPORTAMOS O PACOTE 'cors'
require('dotenv').config();

// Funções e Rotas do nosso projeto
const { connectDB } = require('./config/prismaClient');
const syncRoutes = require('./routes/sync.routes');
const authRoutes = require('./routes/auth.routes');
const deviceRoutes = require('./routes/device.routes.js');
const preventiveRoutes = require('./routes/preventive.routes.js');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURAÇÃO DO CORS (DEVE VIR ANTES DAS ROTAS) ---
// Dizemos ao 'cors' para usar a nossa variável de ambiente como a lista de origens permitidas.
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS,
};
app.use(cors(corsOptions)); 

// Outros Middlewares
app.use(express.json());

// --- REGISTO DAS ROTAS ---
app.use('/api', syncRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', deviceRoutes);
app.use('/api', preventiveRoutes)

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