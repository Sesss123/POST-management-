const express = require('express');
const router = express.Router();
const { getCustomers, createCustomer, getCustomerLedger, updateCustomerStatus } = require('../controllers/customerController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getCustomers);
router.post('/', createCustomer);
router.get('/:id/ledger', getCustomerLedger);
router.patch('/:id/status', adminOnly, updateCustomerStatus);

module.exports = router;
