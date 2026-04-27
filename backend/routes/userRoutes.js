const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUserStatus } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);
router.use(adminOnly);

router.get('/', getUsers);
router.post('/', createUser);
router.patch('/:id/status', updateUserStatus);

module.exports = router;
