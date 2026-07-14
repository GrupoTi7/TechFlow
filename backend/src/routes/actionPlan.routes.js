const express = require('express');
// 🟢 IMPORTAÇÃO CORRIGIDA: Agora importamos o ficheiro inteiro como 'actionPlanController'
const actionPlanController = require('../controllers/actionPlan.controller.js');

const router = express.Router();

// 🟢 Rota para buscar/gerar os planos (GET)
router.get('/', actionPlanController.getActionPlan);

// 🟢 NOVA ROTA: Cria um novo plano de ação com a matemática blindada (POST)
router.post('/', actionPlanController.createActionPlan);

// 🟢 Rota para disparo de e-mails de cobrança (POST)
router.post('/remind', actionPlanController.sendReminder);

module.exports = router;