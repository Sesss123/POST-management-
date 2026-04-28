const express = require('express');
const router = express.Router();
const { getItems, createItem, updateItem, deleteItem } = require('../controllers/itemController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getItems);
router.post('/', authorize('admin', 'manager'), createItem);
router.put('/:id', authorize('admin', 'manager'), updateItem);
router.delete('/:id', authorize('admin', 'manager'), deleteItem);

module.exports = router;
