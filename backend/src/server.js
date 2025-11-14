// src/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron'); 
const { connectDB } = require('./config/prismaClient');

// --- IMPORTAÇÕES ---
const { sendNotificationEmail } = require('./services/notification.service');
// REMOVA A IMPORTAÇÃO DIRETA DO SERVIÇO GLPI AQUI, NÃO PRECISA MAIS
// const { syncGlpiDevices } = require('./services/glpi.service.js'); 

// IMPORTA O WORKER E A FILA
const { initWorker } = require('./worker/sync.worker.js');
const { syncQueue } = require('./config/queue.js');

// Rotas
const syncRoutes = require('./routes/sync.routes.js');
const authRoutes = require('./routes/auth.routes.js');
const deviceRoutes = require('./routes/device.routes.js');
const preventiveRoutes = require('./routes/preventive.routes.js');
const dashboardRoutes = require('./routes/dashboard.routes.js');
const reportsRoutes = require('./routes/reports.routes.js');

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = { origin: process.env.ALLOWED_ORIGINS };
app.use(cors(corsOptions));
app.use(express.json());

// Rotas
app.use('/api', syncRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api', deviceRoutes);
app.use('/api', preventiveRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', reportsRoutes);

async function startServer() {
  try {
    await connectDB();

    // --- INICIA O WORKER EM SEGUNDO PLANO ---
    initWorker(); 
    // ----------------------------------------

    app.listen(PORT, () => {
      console.log(`Servidor iniciado com sucesso na porta ${PORT}`);

      // Tarefa 1: Notificações
      cron.schedule('0 8 * * *', () => {
        console.log('Executando tarefa agendada: Verificação de preventivas...');
        sendNotificationEmail(); 
      }, { scheduled: true, timezone: "America/Sao_Paulo" });

      // --- TAREFA 2: Sincronização GLPI (ATUALIZADA) ---
      cron.schedule('0 * * * *', async () => {
        console.log('--- AGENDANDO SYNC GLPI VIA FILA ---');
        try {
          // O CRON AGORA APENAS ADICIONA NA FILA, NÃO EXECUTA DIRETAMENTE!
          await syncQueue.add('cron-sync', { type: 'automated' });
          console.log('--- TAREFA ADICIONADA À FILA COM SUCESSO ---');
        } catch (error) {
          console.error('--- ERRO AO AGENDAR SYNC ---', error.message);
        }
      }, { scheduled: true, timezone: "America/Sao_Paulo" });
      
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();