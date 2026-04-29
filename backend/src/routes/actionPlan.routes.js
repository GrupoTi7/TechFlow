const express = require('express');
// 🟢 IMPORTAÇÃO CORRIGIDA: Agora importamos o ficheiro inteiro como 'actionPlanController'
const actionPlanController = require('../controllers/actionPlan.controller.js');

const router = express.Router();

// 🟢 Usamos o controller.nomeDaFuncao para todas as rotas
router.get('/', actionPlanController.getActionPlan);
router.post('/remind', actionPlanController.sendReminder);

module.exports = router;