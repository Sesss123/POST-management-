const express = require('express');
const router = express.Router();
const marketingController = require('../controllers/marketingController');

// Routes are shop-scoped via server.js

router.get('/campaigns', marketingController.getCampaigns);
router.post('/campaigns', marketingController.createCampaign);
router.get('/campaigns/:id/logs', marketingController.getCampaignLogs);

module.exports = router;
