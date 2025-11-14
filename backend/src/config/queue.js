// src/config/queue.js
const { Queue } = require('bullmq');

// Configuração da conexão com o Redis (nome do serviço no docker-compose)
const connection = {
  host: 'redis', 
  port: 6379
};

// Cria e exporta a fila chamada 'glpi-sync-queue'
const syncQueue = new Queue('glpi-sync-queue', { connection });

module.exports = { syncQueue, connection };