const express = require('express');
const router = express.Router();
const { 
    createCashSale, 
    createCashSaleCredit,
    createTableCheckout, 
    getInvoices, 
    getInvoiceDetails,
    cancelInvoice,
    splitBill,
    voidInvoice,
    createQuickSale,
    createQuickRetailSale
} = require('../controllers/invoiceController');
const { protect, adminOnly, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin', 'cashier'));

router.get('/', getInvoices);
router.get('/:id', getInvoiceDetails);
router.post('/cash-sale', createCashSale);
router.post('/quick-sale', createQuickSale);
router.post('/quick-retail-sale', createQuickRetailSale);
router.post('/cash-sale/add-to-credit', createCashSaleCredit);
router.post('/table-sale/pay-now', createTableCheckout);
router.post('/table-sale/add-to-credit', createTableCheckout);
router.post('/table-sale/split', splitBill);
router.patch('/:id/cancel', authorize('admin', 'manager', 'cashier'), cancelInvoice);
router.delete('/:id/void', authorize('admin', 'manager', 'cashier'), voidInvoice);

module.exports = router;
