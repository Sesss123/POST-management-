const express = require('express');
const router = express.Router();
const { getPromotions, getApplicablePromotions, createPromotion, deletePromotion } = require('../controllers/promotionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.use(authorize('admin', 'cashier'));

router.get('/', getPromotions);
router.get('/applicable', getApplicablePromotions);
router.post('/', authorize('admin'), createPromotion);
router.delete('/:id', authorize('admin'), deletePromotion);

module.exports = router;
