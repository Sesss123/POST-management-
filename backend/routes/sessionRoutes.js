const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { createKOT } = require('../controllers/kotController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/start', sessionController.openSession);
router.get('/open', sessionController.getOpenSessions);
router.get('/:id', sessionController.getSessionDetails);
router.get('/table/:tableId', sessionController.getActiveSessionByTable);
router.post('/:id/items', sessionController.addItemsToSession);
router.patch('/:id/items/:itemId', sessionController.updateSessionItem);
router.patch('/:id/void-item', sessionController.voidSessionItem);
router.post('/:id/send-kot', createKOT);
router.post('/:id/final-bill/pay-now', sessionController.payNowCheckout);
router.post('/:id/final-bill/add-to-credit', sessionController.addToCreditCheckout);
const { splitBill } = require('../controllers/invoiceController');
router.post('/:id/split-bill', splitBill);
router.post('/:id/transfer', sessionController.transferTable);
router.post('/:id/merge', sessionController.mergeTable);
router.delete('/:id', sessionController.cancelSession);
module.exports = router;
