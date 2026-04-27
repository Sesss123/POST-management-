const express = require('express');
const router = express.Router();
const { addPayment, getCustomerPayments } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/customer-payment', addPayment);
router.get('/customer/:customerId', getCustomerPayments);

module.exports = router;
