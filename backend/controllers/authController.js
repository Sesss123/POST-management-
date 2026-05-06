const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');

const generateToken = (id, role, shopId) => {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        console.warn('WARNING: JWT_SECRET is not set or is less than 32 characters. This is a security risk!');
    }
    return jwt.sign({ id, role, shopId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
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
                   s.subscription_plan
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

        // Check if shop is active (for non-super_admin)
        if (user.role !== 'super_admin' && user.shop_status !== 'active') {
            return res.status(403).json({ 
                success: false, 
                message: `Restaurant account is ${user.shop_status || 'not found'}. Access denied.` 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await logAudit(null, {
                userId: user.id,
                action: 'login_failed',
                entityType: 'user',
                newValue: { email },
                ipAddress,
                userAgent
            });
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
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
                subscriptionStatus: user.subscription_status || 'active',
                subscriptionEndDate: user.subscription_end_date || null,
                gracePeriodUntil: user.grace_until || null,
                trialEndsAt: user.trial_ends_at || null,
                subscriptionPlan: user.subscription_plan || 'standard',
                token: generateToken(user.id, user.role, user.shop_id)
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'An internal server error occurred' });
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
                   s.subscription_status, s.subscription_end_date, s.grace_until, s.trial_ends_at, s.subscription_plan
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
                subscriptionPlan: user.subscription_plan
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
