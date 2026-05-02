const express = require('express');
const router = express.Router();
const heldBillController = require('../controllers/heldBillController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.use(authorize('admin', 'cashier'));

router.get('/', heldBillController.getHeldBills);
router.post('/', heldBillController.holdBill);
router.get('/:id', heldBillController.getHeldBillById);
router.post('/:id/resume', heldBillController.resumeHeldBill);
router.post('/:id/complete', heldBillController.completeHeldBill);
router.patch('/:id/cancel', heldBillController.cancelHeldBill);

module.exports = router;
