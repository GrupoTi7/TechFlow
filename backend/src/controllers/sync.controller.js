// backend/src/controllers/sync.controller.js
const { Queue } = require('bullmq');

// Aponta para a fila 'syncQueue' no Redis
const syncQueue = new Queue('syncQueue', {
  connection: {
    host: 'redis', // O nome do serviço no docker-compose
    port: 6379
  }
});

/**
 * Rota que agenda (adiciona à fila) a sincronização do GLPI.
 * Responde imediatamente com 202 (Aceito).
 */
const httpSyncGlpi = async (req, res) => {
  try {
    // 1. Verifica se já existe um job ativo ou em espera
    const activeJobs = await syncQueue.getJobs(['active', 'waiting']);
    if (activeJobs.length > 0) {
      return res.status(429).json({ // 429 = Too Many Requests
        success: false,
        message: "Sincronização já está em andamento. Tente novamente mais tarde.",
        jobId: activeJobs[0].id
      });
    }

    // 2. Adiciona o novo job à fila
    const job = await syncQueue.add('sincronizar-dispositivos-glpi', {
      triggeredBy: req.user.username // (req.user vem do seu authenticateToken)
    });

    // 3. RESPONDE IMEDIATAMENTE (202 Accepted)
    res.status(202).json({
      success: true,
      message: "Sincronização iniciada. O processo está a decorrer em segundo plano e pode demorar 15 minutos.",
      jobId: job.id
    });

  } catch (error) {
    // Se falhar ao *adicionar* à fila (ex: Redis offline)
    console.error("Erro ao agendar a sincronização:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erro ao agendar a sincronização.",
      error: error.message
    });
  }
};

module.exports = {
  httpSyncGlpi
};