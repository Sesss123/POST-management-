const express = require('express');
const router = express.Router();
const { 
    getItems, 
    getCategories, 
    createItem, 
    updateItem, 
    updatePrice, 
    updateAvailability, 
    updateStatus, 
    updateUsability,
    deleteItem,
    receiveStock,
    syncPopularItems
} = require('../controllers/itemController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getItems);
router.get('/categories', getCategories);
router.post('/sync-popular', authorize('admin'), syncPopularItems);

router.post('/', authorize('admin'), createItem);
router.put('/:id', authorize('admin'), updateItem);
router.patch('/:id/price', authorize('admin'), updatePrice);
router.patch('/:id/availability', authorize('admin', 'kitchen'), updateAvailability);
router.patch('/:id/status', authorize('admin'), updateStatus);
router.patch('/:id/usability', authorize('admin'), updateUsability);
router.delete('/:id', authorize('admin'), deleteItem);
router.post('/:id/receive-stock', authorize('admin'), receiveStock);

module.exports = router;
