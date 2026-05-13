// src/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron'); 
const { Queue } = require('bullmq'); // 🟢 IMPORTAÇÃO DA FILA ADICIONADA
const { connectDB } = require('./config/prismaClient');
const { checkAndSendNotifications } = require('./services/notification.service');

// 🟢 CONFIGURAÇÃO DA FILA PARA O CRON JOB
const glpiCronQueue = new Queue('glpi-sync-queue', {
  connection: { host: 'redis', port: 6379 }
});

// 🟢 IMPORTAÇÃO NECESSÁRIA PARA O PING DO TERMINAL VIRTUAL
const { spawn } = require('child_process');

// 🟢 IMPORTAÇÕES PARA O WEBSOCKET E SSH
const http = require('http');
const { Server } = require('socket.io');
const { Client } = require('ssh2');

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
// IMPORTAR O CONTROLLER DO AGIDESK
const agideskController = require('./controllers/agidesk.controller'); 
const { authenticateToken } = require('./middleware/auth.middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// 🟢 Cria o servidor HTTP acoplado ao Express (Necessário para o Socket.io)
const server = http.createServer(app);

// 🟢 Configura o Socket.io
const io = new Server(server, {
  cors: { origin: process.env.ALLOWED_ORIGINS || '*' }
});

// --- CONFIGURAÇÃO DE SEGURANÇA E MIDDLEWARES (Vêm PRIMEIRO) ---
const corsOptions = { origin: process.env.ALLOWED_ORIGINS || '*' };
app.use(cors(corsOptions));

// Aumentando o limite para 50MB para aceitar os mapas pesados do Zabbix!
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// --- REGISTRO DE ROTAS (Vêm DEPOIS dos middlewares) ---
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

// ROTA DE INTEGRAÇÃO COM AGIDESK
app.post('/api/agidesk/start-ticket', authenticateToken, agideskController.startTicket);


// ======================================================================
// 🟢 ROTA DO TERMINAL VIRTUAL: STREAMING DE PING EM TEMPO REAL PARA O MAPA
// ======================================================================
app.get('/api/ping-stream/:ip', (req, res) => {
    const ip = req.params.ip;

    // Configura o cabeçalho para "Server-Sent Events" (Mantém a conexão aberta)
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    // Inicia o processo de ping no servidor (o argumento '-t' é infinito no Windows)
    // Se o seu servidor rodar em Linux, troque '-t' por '-c', '100' (pinga 100 vezes)
    const isWindows = process.platform === 'win32';
    const pingArgs = isWindows ? [ip, '-t'] : [ip]; 
    const pingProcess = spawn('ping', pingArgs);

    // Quando o CMD/Terminal cuspir uma linha nova de ping, enviamos para o React
    pingProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                res.write(`data: ${line.trim()}\n\n`);
            }
        });
    });

    pingProcess.stderr.on('data', (data) => {
        res.write(`data: ERRO DO SISTEMA: ${data.toString().trim()}\n\n`);
    });

    // Quando o usuário fechar o Modal preto no React, a conexão cai.
    // Então, nós matamos o processo do CMD no servidor para não travar a máquina!
    req.on('close', () => {
        pingProcess.kill();
    });
});
// ======================================================================

// ======================================================================
// 🟢 LÓGICA DO TERMINAL WEB (SSH VIA WEBSOCKET)
// ======================================================================
io.on('connection', (socket) => {
  let sshClient = new Client();

  socket.on('start-ssh', ({ ip, username, password }) => {
    sshClient.on('ready', () => {
      socket.emit('data', '\r\n*** CONECTADO COM SUCESSO VIA TECHFLOW ***\r\n\r\n');
      
      sshClient.shell((err, stream) => {
        if (err) return socket.emit('data', '\r\n*** ERRO AO ABRIR O SHELL DO EQUIPAMENTO ***\r\n');
        
        // O que o utilizador digita no site vai para o Switch
        socket.on('data', (data) => stream.write(data));
        
        // O que o Switch responde vai para o site
        stream.on('data', (data) => socket.emit('data', data.toString('utf-8')));
        
        stream.on('close', () => {
          sshClient.end();
          socket.disconnect();
        });
      });
    }).on('error', (err) => {
      socket.emit('data', `\r\n*** ERRO DE CONEXÃO: ${err.message} ***\r\n`);
    }).connect({
      host: ip,
      port: 22,
      username: username,
      password: password,
      readyTimeout: 10000
    });
  });

  socket.on('disconnect', () => {
    sshClient.end();
  });
});
// ======================================================================


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

// --- INICIALIZAÇÃO DO SERVIDOR (O app.listen vem no FINAL de tudo) ---
async function startServer() {
  try {
    await connectDB();
    
    // 🟢 WORKER ATIVADO NOVAMENTE
    initWorker(); 
    console.log("⚙️ Worker de sincronização do GLPI está online."); 

    // 🟢 MUDANÇA: Usamos server.listen para iniciar tanto Express quanto WebSockets!
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Servidor Web e WebSocket rodando na porta ${PORT} e aceitando conexões externas`);
      
      // Cron Jobs
      cron.schedule('0 8 * * *', () => {
        checkAndSendNotifications(); 
      }, { scheduled: true, timezone: "America/Sao_Paulo" });

      // 🟢 NOVO CRON: Sincronização automática do GLPI a cada 1 hora
      cron.schedule('0 * * * *', () => {
        console.log('⏰ [CRON] Disparando sincronização automática com o GLPI...');
        glpiCronQueue.add('auto-glpi-sync', { triggeredBy: 'CronJob' });
      }, { scheduled: true, timezone: "America/Sao_Paulo" });

    });
  } catch (error) {
    console.error('❌ Erro fatal ao iniciar:', error);
    process.exit(1);
  }
}

startServer();