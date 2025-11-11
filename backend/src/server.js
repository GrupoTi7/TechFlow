// src/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron'); 

// Funções e Rotas do nosso projeto
const { connectDB } = require('./config/prismaClient');

// --- 1. IMPORTAÇÕES DE SERVIÇO ---
const { sendNotificationEmail } = require('./services/notification.service');

const { syncGlpiDevices } = require('./services/glpi.service.js');
// ---------------------------------

// Rotas
const syncRoutes = require('./routes/sync.routes');
const authRoutes = require('./routes/auth.routes');
const deviceRoutes = require('./routes/device.routes.js');
const preventiveRoutes = require('./routes/preventive.routes.js');
const dashboardRoutes = require('./routes/dashboard.routes.js');
const reportsRoutes = require('./routes/reports.routes.js')

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
// Esta linha já está correta e registra a rota de sync manual
app.use('/api', syncRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api', deviceRoutes);
app.use('/api', preventiveRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', reportsRoutes);

// Função de Início
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Servidor iniciado com sucesso na porta ${PORT}`);

      // --- TAREFA AGENDADA 1: Notificações (Já existente) ---
      cron.schedule('0 8 * * *', () => {
        console.log('Executando tarefa agendada: Verificação de preventivas...');
        sendNotificationEmail(); 
      }, {
        scheduled: true,
        timezone: "America/Sao_Paulo" 
      });
      console.log('Tarefa de notificação agendada para 08:00 (America/Sao_Paulo).');

      // --- 2. ADICIONE ESTA NOVA TAREFA AGENDADA ---
      // '0 * * * *' = "A cada hora, no minuto 0"
      cron.schedule('0 * * * *', async () => {
        console.log('--- INICIANDO ROTINA AGENDADA DE SYNC GLPI ---');
        try {
          await syncGlpiDevices();
          console.log('--- ROTINA AGENDADA SYNC GLPI CONCLUÍDA ---');
        } catch (error) {
          console.error('--- ERRO NA ROTINA AGENDADA SYNC GLPI ---', error.message);
        }
      }, {
        scheduled: true,
        timezone: "America/Sao_Paulo"
      });
      console.log('Tarefa de sincronização GLPI agendada para 02:00 (America/Sao_Paulo).');
      // -------------------------------------------------

    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();