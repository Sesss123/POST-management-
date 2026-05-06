const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');

// Routes are shop-scoped via server.js

router.get('/', deliveryController.getDeliveryOrders);
router.post('/manual', deliveryController.createManualOrder);
router.post('/sync-provider', deliveryController.syncProviderOrders);
router.post('/:id/accept', deliveryController.acceptOrder);
router.post('/:id/reject', deliveryController.rejectOrder);
router.patch('/:id/status', deliveryController.updateStatus);

module.exports = router;
