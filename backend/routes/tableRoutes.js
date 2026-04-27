const express = require('express');
const router = express.Router();
const { getTables, updateTableStatus, createTable } = require('../controllers/tableController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getTables);
router.post('/', adminOnly, createTable);
router.patch('/:id/status', updateTableStatus);

module.exports = router;
