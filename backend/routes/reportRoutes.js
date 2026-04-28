const express = require('express');
const router = express.Router();
const { getDashboardSummary, getDailySales, getCustomerBalances, getItemSales, getEODReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin', 'manager'));

router.get('/dashboard', getDashboardSummary);
router.get('/daily-sales', getDailySales);
router.get('/customer-balances', getCustomerBalances);
router.get('/item-sales', getItemSales);
router.get('/eod', getEODReport);

module.exports = router;
