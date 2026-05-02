const express = require('express');
const router = express.Router();
const { runManualBackup, getBackupLogs, getBackupStatus } = require('../controllers/backupController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/status', getBackupStatus);
router.get('/logs', getBackupLogs);
router.post('/run', runManualBackup);

module.exports = router;
