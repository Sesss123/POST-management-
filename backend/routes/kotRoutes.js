const express = require('express');
const router = express.Router();
const kotController = require('../controllers/kotController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Standard KOT APIs
router.get('/', kotController.getKOTs);
router.get('/:id', kotController.getKOTDetails);
router.get('/session/:sessionId', kotController.getKOTsBySession);
router.post('/create', kotController.createKOT); // Legacy support
router.post('/invoice/:invoiceId/send-kot', kotController.createKOTFromInvoice);

module.exports = router;
