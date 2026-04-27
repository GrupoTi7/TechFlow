const express = require('express');
const { getActionPlan } = require('../controllers/actionPlan.controller.js');

const router = express.Router();

router.get('/', getActionPlan);

router.post('/remind', actionPlanController.sendReminder);

module.exports = router;