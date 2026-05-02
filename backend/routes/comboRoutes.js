const express = require('express');
const router = express.Router();
const { getCombos, createCombo, deleteCombo } = require('../controllers/comboController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.use(authorize('admin', 'cashier'));

router.get('/', getCombos);
router.post('/', authorize('admin'), createCombo);
router.delete('/:id', authorize('admin'), deleteCombo);

module.exports = router;
