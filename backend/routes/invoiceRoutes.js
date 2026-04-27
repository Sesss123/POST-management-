const express = require('express');
const router = express.Router();
const { 
    createCashSale, 
    createTableSalePayNow, 
    createTableSaleCredit, 
    getInvoices, 
    getInvoiceDetails,
    cancelInvoice
} = require('../controllers/invoiceController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getInvoices);
router.get('/:id', getInvoiceDetails);
router.post('/cash-sale', createCashSale);
router.post('/table-sale/pay-now', createTableSalePayNow);
router.post('/table-sale/add-to-credit', createTableSaleCredit);
router.patch('/:id/cancel', adminOnly, cancelInvoice);

module.exports = router;
