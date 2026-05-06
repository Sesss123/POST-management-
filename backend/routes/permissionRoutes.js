const express = require('express');
const router = express.Router();
const permController = require('../controllers/permissionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin', 'super_admin'));

router.get('/', permController.getAllPermissions);
router.get('/roles', permController.getRolePermissions);
router.post('/roles', permController.updateRolePermissions);
router.get('/users/:userId', permController.getUserOverrides);
router.post('/users/:userId', permController.updateUserOverrides);

module.exports = router;
