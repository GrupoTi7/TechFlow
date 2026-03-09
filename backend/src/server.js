// src/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron'); 
const { connectDB } = require('./config/prismaClient');
const { checkAndSendNotifications } = require('./services/notification.service');

// Workers e Filas
const { initWorker } = require('./sync.worker.js');
const { syncQueue } = require('./config/queue.js');

// --- IMPORTAÇÃO DE ROTAS ---
const authRoutes = require('./routes/auth.routes.js');
const reportRoutes = require('./routes/reports.routes.js');
const userRoutes = require('./routes/user.routes.js');
const deviceRoutes = require('./routes/device.routes.js');
const preventiveRoutes = require('./routes/preventive.routes.js');
const dashboardRoutes = require('./routes/dashboard.routes.js');
const syncRoutes = require('./routes/sync.routes.js');

// Rotas de Configuração (Serviços)
const sectorRoutes = require('./routes/sector.routes.js'); 
const deviceTypeRoutes = require('./routes/deviceType.routes.js'); 
const planRoutes = require('./routes/plans.routes.js'); 

// Controllers Avulsos
const plansController = require('./controllers/plans.controller');
// 🟢 IMPORTAR O CONTROLLER DO AGIDESK (QUE VOCÊ VAI CRIAR)
const agideskController = require('./controllers/agidesk.controller'); 
const { authenticateToken } = require('./middleware/auth.middleware');

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = { origin: process.env.ALLOWED_ORIGINS || '*' };
app.use(cors(corsOptions));
app.use(express.json());

// --- REGISTRO DE ROTAS ---
app.use('/api', syncRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', deviceRoutes); 
app.use('/api', preventiveRoutes); 
app.use('/api', dashboardRoutes); 
app.use('/api', reportRoutes); 

// Rotas da Página de Serviços
app.use('/api/sectors', sectorRoutes);        
app.use('/api/device-types', deviceTypeRoutes); 
app.use('/api/plans', planRoutes);            

// Rota Avulsa para o Widget (Plano do Usuário)
app.get('/api/action-plan', authenticateToken, plansController.getUserActionPlan);

// 🟢 ROTA DE INTEGRAÇÃO COM AGIDESK
app.post('/api/agidesk/start-ticket', authenticateToken, agideskController.startTicket);

// Rota de Teste
app.all('/api/test-email', async (req, res) => {
  console.log("Teste de e-mail manual...");
  try {
    const result = await checkAndSendNotifications();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

async function startServer() {
  try {
    await connectDB();
    
    // 🔴 Worker DESATIVADO para debug
    // initWorker(); 
    console.log("⚠️ ATENÇÃO: Worker de sincronização DESATIVADO temporariamente para liberar a API.");

    app.listen(PORT, () => {
      console.log(`✅ Servidor rodando na porta ${PORT}`);
      
      // Cron Jobs
      cron.schedule('0 8 * * *', () => {
        checkAndSendNotifications(); 
      }, { scheduled: true, timezone: "America/Sao_Paulo" });

    });
  } catch (error) {
    console.error('❌ Erro fatal ao iniciar:', error);
    process.exit(1);
  }
}

startServer();