// src/workers/sync.worker.js
const { Worker } = require('bullmq');
const { connection } = require('../config/queue.js');
const { syncGlpiDevices } = require('../services/glpi.service.js'); // Sua lógica original

const initWorker = () => {
  const worker = new Worker('glpi-sync-queue', async (job) => {
    console.log(`[Worker] Iniciando Job ${job.id}: Sincronização GLPI...`);
    
    try {
      // AQUI chamamos a sua função pesada original
      await syncGlpiDevices();
      console.log(`[Worker] Job ${job.id} concluído com sucesso.`);
    } catch (error) {
      console.error(`[Worker] Job ${job.id} falhou:`, error);
      throw error; // O BullMQ saberá que falhou
    }

  }, { connection });

  console.log('Worker de Sincronização iniciado e aguardando tarefas...');
};

module.exports = { initWorker };