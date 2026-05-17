const express = require('express');
const router = express.Router();
const { syncDraft, getSummary } = require('../controllers/offlineSyncController');
const { authorize } = require('../middleware/authMiddleware');

router.post('/drafts', authorize('admin', 'manager', 'cashier'), syncDraft);
router.get('/summary', authorize('admin', 'super-admin'), getSummary);

module.exports = router;
