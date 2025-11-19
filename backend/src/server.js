// src/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron'); 
const { connectDB } = require('./config/prismaClient');

// --- CORREÇÃO AQUI: Importar APENAS a função correta ---
const { checkAndSendNotifications } = require('./services/notification.service');

// IMPORTA O WORKER E A FILA
const { initWorker } = require('./sync.worker.js');
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

// Rota de teste manual de e-mail
app.all('/api/test-email', async (req, res) => {
  console.log("Recebida requisição manual de teste de e-mail...");
  try {
    const result = await checkAndSendNotifications();
    res.json(result);
  } catch (error) {
    console.error("Falha no teste manual:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message, 
      stack: error.stack 
    });
  }
});

async function startServer() {
  try {
    await connectDB();

    // --- INICIA O WORKER EM SEGUNDO PLANO ---
    initWorker(); 
    // ----------------------------------------

    app.listen(PORT, () => {
      console.log(`Servidor iniciado com sucesso na porta ${PORT}`);

      // Tarefa 1: Notificações (CORRIGIDO)
      cron.schedule('0 8 * * *', () => {
        console.log('Executando tarefa agendada: Verificação de preventivas...');
        // CORREÇÃO: Usar a função que realmente existe
        checkAndSendNotifications(); 
      }, { scheduled: true, timezone: "America/Sao_Paulo" });

      // --- TAREFA 2: Sincronização GLPI ---
      cron.schedule('0 * * * *', async () => {
        console.log('--- AGENDANDO SYNC GLPI VIA FILA ---');
        try {
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