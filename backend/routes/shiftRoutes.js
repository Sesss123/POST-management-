const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/open', shiftController.openShift);
router.post('/close', shiftController.closeShift);
router.get('/current', shiftController.getCurrentShift);
router.get('/', shiftController.getShifts);
router.post('/cash-movement', shiftController.recordCashMovement);

module.exports = router;
