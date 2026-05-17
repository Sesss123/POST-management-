const express = require('express');
const router = express.Router();
const { 
    getDashboardSummary, 
    getDailySales, 
    getCustomerBalances, 
    getItemSales, 
    getEODReport, 
    getCashierDashboard, 
    getCreditSummary, 
    getSupplierSummary, 
    getAnalytics, 
    getAlerts, 
    getBusinessIntelligence,
    getCashCollectionReport
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Dashboards (accessible by admin, manager, cashier)
router.get('/cashier-dashboard', authorize('admin', 'cashier'), getCashierDashboard);
router.get('/credit-summary', authorize('admin', 'cashier'), getCreditSummary);

// Admin only routes
router.use(authorize('admin'));

router.get('/dashboard', getDashboardSummary);
router.get('/daily-sales', getDailySales);
router.get('/customer-balances', getCustomerBalances);
router.get('/item-sales', getItemSales);
router.get('/eod', getEODReport);
router.get('/supplier-summary', getSupplierSummary);
router.get('/analytics', getAnalytics);
router.get('/alerts', getAlerts);
router.get('/business-intelligence', getBusinessIntelligence);
router.get('/cash-collection', getCashCollectionReport);

module.exports = router;
