const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getSettings);
router.post('/', authorize('admin', 'manager'), updateSettings);

module.exports = router;
