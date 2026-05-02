const express = require('express');
const router = express.Router();
const { getReservations, createReservation, updateStatus, assignTable } = require('../controllers/reservationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getReservations)
    .post(createReservation);

router.patch('/:id/status', updateStatus);
router.patch('/:id/assign-table', assignTable);

module.exports = router;
