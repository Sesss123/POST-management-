const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { protect, adminOnly, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.use(authorize('admin', 'cashier'));

router.get('/', customerController.getCustomers);
router.get('/debtors', customerController.getDebtors);
router.post('/', customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.get('/:id/ledger', customerController.getCustomerLedger);
router.get('/:id/account', customerController.getAccountDetails);
router.get('/:id/loyalty', customerController.getLoyaltyHistory);
router.post('/:id/loyalty/adjust', authorize('admin'), customerController.adjustLoyaltyPoints);
router.patch('/:id/status', authorize('admin'), customerController.updateCustomerStatus);

module.exports = router;
