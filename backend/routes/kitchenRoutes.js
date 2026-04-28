const express = require('express');
const router = express.Router();
const { getKitchenKOTs, updateKOTStatus } = require('../controllers/kotController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/kots', getKitchenKOTs);
router.patch('/kots/:id/status', updateKOTStatus);

module.exports = router;
