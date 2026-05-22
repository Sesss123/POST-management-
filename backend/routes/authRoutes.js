const express = require('express');
const router = express.Router();
const { login, verify2FA, getMe, forgotPassword, resetPassword, logout, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/verify-2fa', verify2FA);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/change-password', protect, changePassword);

module.exports = router;
