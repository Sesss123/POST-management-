const express = require('express');
const router = express.Router();
const kotController = require('../controllers/kotController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Standard KOT APIs
router.get('/', kotController.getKOTs);
router.get('/:id', kotController.getKOTDetails);
router.post('/create', kotController.createKOT); // Legacy support
router.patch('/:id/status', kotController.updateKOTStatus);
router.patch('/items/:id/status', kotController.updateKOTItemStatus);

// Kitchen Specific APIs
router.get('/kitchen/kots', kotController.getKitchenKOTs);

module.exports = router;
