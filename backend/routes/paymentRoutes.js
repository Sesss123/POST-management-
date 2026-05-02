const express = require('express');
const router = express.Router();
const { addPayment, getCustomerPayments } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin', 'cashier'));

router.post('/customer-payment', addPayment);
router.get('/customer/:customerId', getCustomerPayments);

module.exports = router;
