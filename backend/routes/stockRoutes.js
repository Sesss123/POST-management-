const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/low', stockController.getLowStockItems);
router.post('/adjust', stockController.adjustStock);
router.get('/movements/:itemId', stockController.getStockMovements);

module.exports = router;
