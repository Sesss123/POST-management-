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
        const [result] = await db.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'User not found' });
        
        const [updatedUser] = await db.query('SELECT id, name, email, role, status FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'User status updated', data: updatedUser[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
