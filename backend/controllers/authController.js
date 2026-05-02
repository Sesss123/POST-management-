const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');

const generateToken = (id, role) => {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        console.warn('WARNING: JWT_SECRET is not set or is less than 32 characters. This is a security risk!');
    }
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
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
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
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
            return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact administrator.' });
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
            newValue: { email, role: user.role },
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
                token: generateToken(user.id, user.role)
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
        const [users] = await db.query('SELECT id, name, email, role, status FROM users WHERE id = ?', [req.user.id]);
        const user = users[0];

        if (user) {
            res.json({ success: true, data: user });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
