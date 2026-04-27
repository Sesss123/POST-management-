const express = require('express');
const router = express.Router();
const { getDashboardSummary, getDailySales, getCustomerBalances, getItemSales } = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', getDashboardSummary);
router.get('/daily-sales', adminOnly, getDailySales);
router.get('/customer-balances', adminOnly, getCustomerBalances);
router.get('/item-sales', adminOnly, getItemSales);

module.exports = router;
