const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/', supplierController.getSuppliers);
router.post('/', supplierController.createSupplier);
router.get('/:id/account', supplierController.getSupplierAccount);
router.post('/:id/payments', supplierController.recordPayment);
router.patch('/:id/status', supplierController.updateStatus);

module.exports = router;
