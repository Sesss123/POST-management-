const express = require('express');
const router = express.Router();
const { getPublicItems, getMenuByTable, getPublicReceipt } = require('../controllers/publicMenuController');

// All routes are public — no auth required
// Routes are now shop-scoped via :shopIdentifier in the URL
router.get('/:shopIdentifier/items', getPublicItems);
router.get('/:shopIdentifier/table/:tableNo', getMenuByTable);
router.get('/receipt/:uuid', getPublicReceipt);

module.exports = router;
