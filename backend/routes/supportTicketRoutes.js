const express = require('express');
const router = express.Router();
const { createTicket, getShopTickets } = require('../controllers/supportTicketController');

router.post('/', createTicket);
router.get('/', getShopTickets);

module.exports = router;
