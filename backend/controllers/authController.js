const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
const subscriptionService = require('../services/subscriptionService');
const platformSettingsService = require('../services/platformSettingsService');

const generateToken = (id, role, shopId, shopSlug, tokenVersion = 0, expiryHrs = 24) => {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        console.warn('WARNING: JWT_SECRET is not set or is less than 32 characters. This is a security risk!');
    }
    return jwt.sign({ id, role, shopId, shopSlug, token_version: tokenVersion }, process.env.JWT_SECRET, {
        expiresIn: `${expiryHrs}h`
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { email, password } = req.body;
    const { logAudit } = require('../utils/auditLogger');
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    try {
        const [users] = await db.query(`
            SELECT u.*, 
                   s.status as shop_status, 
                   s.name as shop_name, 
                   s.identifier as shop_identifier,
                   s.subscription_status,
                   s.subscription_end_date,
                   s.grace_until,
                   s.trial_ends_at,
                   s.subscription_plan,
                   s.has_delivery_orders,
                   s.has_marketing_center,
                   s.has_quick_retail,
                   s.module_permissions
            FROM users u
            LEFT JOIN shops s ON u.shop_id = s.id
            WHERE u.email = ?
        `, [email]);
        const user = users[0];

        if (!user) {
            await logAudit(null, {
                action: 'login_failed',
                entityType: 'user',
                newValue: { email },
                ipAddress,
                userAgent
            });
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Check if user is active
        if (user.status !== 'active') {
            await logAudit(null, {
                userId: user.id,
                action: 'inactive_user_login_attempt',
                entityType: 'user',
                newValue: { email, status: user.status },
                ipAddress,
                userAgent
            });
            return res.status(403).json({ success: false, message: 'Account is deactivated.' });
        }

        // Check Maintenance Mode
        if (platformSettingsService.getBool('maintenance_mode') && user.role !== 'super_admin') {
            return res.status(503).json({ 
                success: false, 
                maintenance: true,
                message: 'System is under maintenance. Only platform administrators can access at this time.' 
            });
        }

        // Check if account is locked
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
            return res.status(403).json({ 
                success: false, 
                message: `Account is temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minutes.` 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            const maxAttempts = platformSettingsService.getInt('max_login_attempts', 5);
            const newAttempts = (user.failed_login_attempts || 0) + 1;
            
            let updateQuery = 'UPDATE users SET failed_login_attempts = ? WHERE id = ?';
            let updateParams = [newAttempts, user.id];
            let errorMessage = 'Invalid email or password';

            if (newAttempts >= maxAttempts) {
                const lockMinutes = 15;
                const lockedUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
                updateQuery = 'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?';
                updateParams = [newAttempts, lockedUntil, user.id];
                errorMessage = `Too many failed attempts. Account locked for ${lockMinutes} minutes.`;
            }

            await db.query(updateQuery, updateParams);

            await logAudit(null, {
                userId: user.id,
                action: 'login_failed',
                entityType: 'user',
                newValue: { email, attempts: newAttempts },
                ipAddress,
                userAgent
            });
            return res.status(401).json({ success: false, message: errorMessage });
        }

        // Reset failed attempts on success
        if (user.failed_login_attempts > 0) {
            await db.query('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?', [user.id]);
        }

        // Check if 2FA is required (Individual or Platform-wide for admins)
        const force2faAdmins = platformSettingsService.getBool('force_2fa_admins');
        const is2faRequired = user.is_2fa_enabled || (force2faAdmins && user.role === 'super_admin');

        if (is2faRequired) {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

            await db.query(
                'UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?',
                [otp, otpExpiry, user.id]
            );

            const notificationService = require('../services/notificationService');
            await notificationService.send2FAOTP(user.email, otp);

            return res.json({ 
                success: true, 
                require2FA: true, 
                tempId: user.id,
                email: user.email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + "*".repeat(gp3.length))
            });
        }

        await logAudit(null, {
            userId: user.id,
            action: 'login_success',
            entityType: 'user',
            newValue: { email, role: user.role, shopId: user.shop_id },
            ipAddress,
            userAgent
        });

        // Update last login info
        await db.query(
            'UPDATE users SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?',
            [ipAddress, user.id]
        );

        res.json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                shopId: user.shop_id,
                shopName: user.shop_name,
                shopIdentifier: user.shop_identifier,
                subscriptionStatus: subscriptionService.resolveEffectiveSubscriptionStatus(user),
                subscriptionEndDate: user.subscription_end_date || null,
                gracePeriodUntil: user.grace_until || null,
                trialEndsAt: user.trial_ends_at || null,
                subscriptionPlan: user.subscription_plan || 'standard',
                hasDeliveryOrders: !!user.has_delivery_orders,
                token: generateToken(user.id, user.role, user.shop_id, user.shop_identifier, user.token_version)
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'An internal server error occurred' });
    }
};

// @desc    Verify 2FA OTP
// @route   POST /api/auth/verify-2fa
// @access  Public
exports.verify2FA = async (req, res) => {
    const { tempId, otp } = req.body;
    const { logAudit } = require('../utils/auditLogger');
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    try {
        const [users] = await db.query(`
            SELECT u.*, 
                   s.status as shop_status, 
                   s.name as shop_name, 
                   s.identifier as shop_identifier,
                   s.subscription_status,
                   s.subscription_end_date,
                   s.grace_until,
                   s.trial_ends_at,
                   s.subscription_plan,
                   s.has_delivery_orders,
                   s.has_marketing_center,
                   s.has_quick_retail
            FROM users u
            LEFT JOIN shops s ON u.shop_id = s.id
            WHERE u.id = ?
        `, [tempId]);
        const user = users[0];

        if (!user || user.otp_code !== otp || new Date() > new Date(user.otp_expires_at)) {
            await logAudit(null, {
                userId: tempId,
                action: '2fa_failed',
                entityType: 'user',
                details: 'Invalid or expired OTP',
                ipAddress,
                userAgent
            });
            return res.status(401).json({ success: false, message: 'Invalid or expired verification code' });
        }

        // Clear OTP
        await db.query('UPDATE users SET otp_code = NULL, otp_expires_at = NULL, last_login_at = NOW(), last_login_ip = ? WHERE id = ?', [ipAddress, user.id]);

        await logAudit(null, {
            userId: user.id,
            action: 'login_success_2fa',
            entityType: 'user',
            newValue: { email: user.email, role: user.role },
            ipAddress,
            userAgent
        });

        res.json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                shopId: user.shop_id,
                shopName: user.shop_name,
                shopIdentifier: user.shop_identifier,
                subscriptionStatus: user.subscription_status || 'active',
                subscriptionEndDate: user.subscription_end_date || null,
                gracePeriodUntil: user.grace_until || null,
                trialEndsAt: user.trial_ends_at || null,
                subscriptionPlan: user.subscription_plan || 'standard',
                hasDeliveryOrders: !!user.has_delivery_orders,
                token: generateToken(user.id, user.role, user.shop_id, user.shop_identifier, user.token_version)
            }
        });
    } catch (error) {
        console.error('2FA Verification Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT u.id, u.name, u.email, u.role, u.status, u.shop_id, 
                   s.name as shop_name, s.identifier as shop_identifier,
                   s.subscription_status, s.subscription_end_date, s.grace_until, s.trial_ends_at, s.subscription_plan,
                   s.has_delivery_orders, s.has_marketing_center, s.has_quick_retail, s.module_permissions
            FROM users u
            LEFT JOIN shops s ON u.shop_id = s.id
            WHERE u.id = ?
        `, [req.user.id]);
        const user = users[0];

        if (user) {
            const formattedUser = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                shopId: user.shop_id,
                shopName: user.shop_name,
                shopIdentifier: user.shop_identifier,
                subscriptionStatus: user.subscription_status,
                subscriptionEndDate: user.subscription_end_date,
                gracePeriodUntil: user.grace_until,
                trialEndsAt: user.trial_ends_at,
                subscriptionPlan: user.subscription_plan,
                hasDeliveryOrders: !!user.has_delivery_orders,
                hasMarketingCenter: !!user.has_marketing_center,
                hasQuickRetail: !!user.has_quick_retail,
                modulePermissions: typeof user.module_permissions === 'string' ? JSON.parse(user.module_permissions) : user.module_permissions
            };
            res.json({ success: true, data: formattedUser });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Forgot password - generate reset token
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    const { logAudit } = require('../utils/auditLogger');

    try {
        const [[user]] = await db.query('SELECT id, name, email FROM users WHERE email = ?', [email]);
        
        if (!user) {
            // Don't reveal user existence for security
            return res.json({ success: true, message: 'If an account exists with that email, a reset link has been sent.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        await db.query(
            'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
            [hashedToken, tokenExpiry, user.id]
        );

        // In production, send an email. For now, log to console.
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
        
        console.log('--- FORGOT PASSWORD MOCK EMAIL ---');
        console.log(`To: ${user.email}`);
        console.log(`Subject: Password Reset Request`);
        console.log(`Reset Link: ${resetUrl}`);
        console.log('---------------------------------');

        await logAudit(null, {
            userId: user.id,
            action: 'password_reset_requested',
            entityType: 'user',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.json({ success: true, message: 'If an account exists with that email, a reset link has been sent.' });
    } catch (error) {
        console.error('ForgotPassword Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    const { logAudit } = require('../utils/auditLogger');

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const [[user]] = await db.query(
            'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
            [hashedToken]
        );

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
            [hashedPassword, user.id]
        );

        await logAudit(null, {
            userId: user.id,
            action: 'password_reset_completed',
            entityType: 'user',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
        console.error('ResetPassword Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Logout user (Revokes all active sessions via token_version)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
    try {
        // Increment token_version to instantly invalidate all currently issued JWTs for this user
        await db.query('UPDATE users SET token_version = token_version + 1 WHERE id = ?', [req.user.id]);
        
        const { logAudit } = require('../utils/auditLogger');
        await logAudit(null, {
            userId: req.user.id,
            action: 'logout_success',
            entityType: 'user',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.json({ success: true, message: 'Logged out successfully on all devices.' });
    } catch (error) {
        console.error('Logout Error:', error);
        res.status(500).json({ success: false, message: 'Server error during logout' });
    }
};

// @desc    Change password (authenticated user)
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const { logAudit } = require('../utils/auditLogger');

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }

    try {
        const [[user]] = await db.query('SELECT id, password FROM users WHERE id = ?', [req.user.id]);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Incorrect current password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await db.query('UPDATE users SET password = ?, temp_password = ? WHERE id = ?', [hashedPassword, newPassword, req.user.id]);

        await logAudit(null, {
            userId: req.user.id,
            action: 'password_changed',
            entityType: 'user',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('ChangePassword Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
