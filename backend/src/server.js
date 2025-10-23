// src/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron'); // <-- 1. Importe o node-cron

// Funções e Rotas do nosso projeto
const { connectDB } = require('./config/prismaClient');
const { sendNotificationEmail } = require('./services/notification.service'); // <-- 2. Importe a função
const syncRoutes = require('./routes/sync.routes');
const authRoutes = require('./routes/auth.routes');
const deviceRoutes = require('./routes/device.routes.js');
const preventiveRoutes = require('./routes/preventive.routes.js');
const dashboardRoutes = require('./routes/dashboard.routes.js');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURAÇÃO DO CORS ---
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS,
};
app.use(cors(corsOptions));
// ----------------------------

// Outros Middlewares
app.use(express.json());

// --- REGISTO DE TODAS AS ROTAS ---
app.use('/api', syncRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', deviceRoutes);
app.use('/api', preventiveRoutes);
app.use('/api', dashboardRoutes);

// Função de Início
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Servidor iniciado com sucesso na porta ${PORT}`);

      // --- 3. AGENDAMENTO DA TAREFA ---
      // '0 8 * * *' = "Às 8h da manhã, todos os dias"
      cron.schedule('0 8 * * *', () => {
        console.log('Executando tarefa agendada: Verificação de preventivas...');
        sendNotificationEmail(); 
      }, {
        scheduled: true,
        timezone: "America/Sao_Paulo" // Ajuste para o seu fuso horário
      });
      // Esta é a mensagem que irá aparecer agora:
      console.log('Tarefa de notificação agendada para rodar diariamente às 08:00 (America/Sao_Paulo).');
      // --------------------------------

      // --- TESTE IMEDIATO (OPCIONAL) ---
      // Para testar agora, descomente a linha abaixo.
      //console.log('Executando verificação de preventivas imediatamente para teste...');
      //sendNotificationEmail(); 
      // ---------------------------------

    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();