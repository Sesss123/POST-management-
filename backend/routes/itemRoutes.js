const express = require('express');
const router = express.Router();
const { getItems, createItem, updateItem, deleteItem } = require('../controllers/itemController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getItems);
router.post('/', adminOnly, createItem);
router.put('/:id', adminOnly, updateItem);
router.delete('/:id', adminOnly, deleteItem);

module.exports = router;
