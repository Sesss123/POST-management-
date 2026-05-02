const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUserStatus, getWaiters } = require('../controllers/userController');
const { protect, adminOnly, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Allow cashiers to get list of waiters (now just cashiers acting as waiters) if needed, 
// but we'll restrict this to admin/cashier for now.
router.get('/waiters', authorize('admin', 'cashier'), getWaiters);

router.use(adminOnly);

router.get('/', getUsers);
router.post('/', createUser);
router.patch('/:id/status', updateUserStatus);

module.exports = router;
