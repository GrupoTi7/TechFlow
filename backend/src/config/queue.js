// src/config/queue.js
const { Queue } = require('bullmq');
require('dotenv').config(); // Garante que o .env seja lido

// Configuração da conexão com o Redis
const connection = {
  // Pega do .env (localhost) ou usa 'localhost' como padrão seguro
  host: process.env.REDIS_HOST || 'localhost', 
  port: process.env.REDIS_PORT || 6379
};

console.log(`🔌 Conectando ao Redis em: ${connection.host}:${connection.port}`);

// Cria e exporta a fila chamada 'glpi-sync-queue'
const syncQueue = new Queue('glpi-sync-queue', { connection });

module.exports = { syncQueue, connection };