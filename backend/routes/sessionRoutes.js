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
router.post('/:id/split-bill', sessionController.splitBill);

module.exports = router;
