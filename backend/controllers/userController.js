const { db } = require('../config/db');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, name, email, role, status, created_at FROM users ORDER BY name ASC');
        res.json({ success: true, data: users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const [userExists] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (userExists.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role || 'cashier']
        );

        const { logAction } = require('../utils/logger');
        await logAction(req.user.id, 'user_created', 'user', result.insertId, null, { name, email, role: role || 'cashier' });

        res.status(201).json({ 
            success: true, 
            data: { id: result.insertId, name, email, role: role || 'cashier' } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update user status
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
    const { status } = req.body;
    try {
        const [oldUser] = await db.query('SELECT status, role FROM users WHERE id = ?', [req.params.id]);
        if (oldUser.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

        await db.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
        
        const action = status === 'active' ? 'user_reactivated' : 'user_deactivated';
        const { logAction } = require('../utils/logger');
        await logAction(req.user.id, action, 'user', req.params.id, { status: oldUser[0].status }, { status });

        const [updatedUser] = await db.query('SELECT id, name, email, role, status FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'User status updated', data: updatedUser[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all waiters
// @route   GET /api/users/waiters
// @access  Private/Admin,Manager,Cashier
exports.getWaiters = async (req, res) => {
    try {
        const [waiters] = await db.query('SELECT id, name FROM users WHERE role IN ("cashier", "admin") AND status = "active" ORDER BY name ASC');
        res.json({ success: true, data: waiters });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
