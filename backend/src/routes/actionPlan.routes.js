const express = require('express');
const { getActionPlan } = require('../controllers/actionPlan.controller.js');

const router = express.Router();

router.get('/', getActionPlan);

module.exports = router;