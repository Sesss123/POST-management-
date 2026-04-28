const express = require('express');
const router = express.Router();
const { 
    createCashSale, 
    createTableCheckout, // Use this for both pay-now and credit
    getInvoices, 
    getInvoiceDetails,
    cancelInvoice,
    splitBill // Add this
} = require('../controllers/invoiceController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getInvoices);
router.get('/:id', getInvoiceDetails);
router.post('/cash-sale', createCashSale);
router.post('/table-sale/pay-now', createTableCheckout);
router.post('/table-sale/add-to-credit', createTableCheckout);
router.post('/table-sale/split', splitBill);
router.patch('/:id/cancel', adminOnly, cancelInvoice);

module.exports = router;
