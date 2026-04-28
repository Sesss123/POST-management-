const express = require('express');
const router = express.Router();
const heldBillController = require('../controllers/heldBillController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', heldBillController.holdBill);
router.get('/', heldBillController.getHeldBills);
router.get('/:id', heldBillController.getHeldBillById);
router.patch('/:id/cancel', heldBillController.cancelHeldBill);
router.post('/:id/complete', heldBillController.completeHeldBill);

module.exports = router;
