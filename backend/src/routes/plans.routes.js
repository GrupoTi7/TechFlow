const express = require('express');
const router = express.Router();
const controller = require('../controllers/plans.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.get('/', authenticateToken, controller.listPlans);
router.post('/', authenticateToken, controller.createPlan);
router.post('/remind', authenticateToken, controller.sendReminder);
router.delete('/:id', authenticateToken, controller.deletePlan);

module.exports = router;