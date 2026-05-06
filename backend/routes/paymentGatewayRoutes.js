const express = require('express');
const router = express.Router();
const { 
    createQRRequest, 
    checkTransactionStatus, 
    handleGenieWebhook, 
    mockMarkPaid,
    cancelTransaction
} = require('../controllers/paymentGatewayController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public Webhook (No Auth)
router.post('/webhooks/dialog-genie', handleGenieWebhook);

// Protected Routes
router.use(protect);

router.post('/qr/create', authorize('admin', 'cashier'), createQRRequest);
router.get('/transactions/:uuid/status', checkTransactionStatus);
router.post('/transactions/:uuid/cancel', cancelTransaction);

// Dev/Mock Only
router.post('/mock/:uuid/mark-paid', authorize('admin', 'cashier'), mockMarkPaid);

module.exports = router;
