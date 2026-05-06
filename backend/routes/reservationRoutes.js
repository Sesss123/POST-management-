const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');

// Routes are shop-scoped via server.js

router.get('/', reservationController.getReservations);
router.post('/', reservationController.createReservation);

router.get('/:identifier', reservationController.getReservationById);
router.put('/:uuid', reservationController.updateReservation);
router.patch('/:uuid/status', reservationController.updateStatus);
router.post('/:uuid/seat', reservationController.seatReservation);
router.patch('/:uuid/cancel', reservationController.cancelReservation);
router.patch('/:uuid/no-show', reservationController.markNoShow);

module.exports = router;
