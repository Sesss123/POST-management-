const express = require('express');
const { getSettings, getSettingsByGroup, updateSettings, updateSettingByKey } = require('../controllers/settingController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getSettings);
router.get('/group/:groupName', getSettingsByGroup);

// Admin only can update
router.put('/', authorize('admin'), updateSettings);
router.patch('/:key', authorize('admin'), updateSettingByKey);

module.exports = router;
