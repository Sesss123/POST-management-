const express = require('express');
const router = express.Router();
const { 
    getActiveKots, 
    getHistoryKots, 
    updateKotStatus, 
    cancelKot, 
    updateItemStatus 
} = require('../controllers/kitchenController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All kitchen routes are protected
router.use(protect);
router.use(authorize('admin', 'kitchen'));

// Active KOTs and History
router.get('/kots', getActiveKots);
router.get('/history', getHistoryKots);

// Status Updates
router.patch('/kots/:id/status', updateKotStatus);
router.patch('/kots/:id/cancel', cancelKot);
router.patch('/kot-items/:itemId/status', updateItemStatus);

module.exports = router;
