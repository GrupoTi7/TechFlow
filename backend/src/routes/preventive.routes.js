const express = require('express');
const { getPreventivesForDevice, createPreventiveForDevice } = require('../controllers/preventive.controller');

const router = express.Router();

// GET /devices/:deviceId/preventives
router.get('/devices/:deviceId/preventives', getPreventivesForDevice);

// POST /devices/:deviceId/preventives
router.post('/devices/:deviceId/preventives', createPreventiveForDevice);

module.exports = router;


