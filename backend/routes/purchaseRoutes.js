const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/', purchaseController.getPurchases);
router.post('/', purchaseController.createPurchase);
router.get('/:id', purchaseController.getPurchaseDetails);

module.exports = router;
