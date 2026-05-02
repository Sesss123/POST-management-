const express = require('express');
const router = express.Router();
const { 
    getModifiers, 
    createModifier, 
    updateModifier 
} = require('../controllers/modifierController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.use(authorize('admin', 'cashier'));

router.get('/', getModifiers);
router.post('/', authorize('admin'), createModifier);
router.put('/:id', authorize('admin'), updateModifier);

module.exports = router;
