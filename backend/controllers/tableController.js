const { db } = require('../config/db');

// @desc    Get all tables
// @route   GET /api/tables
// @access  Private
exports.getTables = async (req, res) => {
    try {
        const [tables] = await db.query('SELECT * FROM restaurant_tables ORDER BY table_no ASC');
        res.json({ success: true, data: tables });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update table status
// @route   PATCH /api/tables/:id/status
// @access  Private
exports.updateTableStatus = async (req, res) => {
    const { status } = req.body;
    try {
        await db.query('UPDATE restaurant_tables SET status = ? WHERE id = ?', [status, req.params.id]);
        const [updatedTable] = await db.query('SELECT * FROM restaurant_tables WHERE id = ?', [req.params.id]);
        
        if (updatedTable.length === 0) return res.status(404).json({ success: false, message: 'Table not found' });
        res.json({ success: true, message: 'Table status updated', data: updatedTable[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create new table
// @route   POST /api/tables
// @access  Private/Admin
exports.createTable = async (req, res) => {
    const { table_no } = req.body;
    try {
        const [result] = await db.query('INSERT INTO restaurant_tables (table_no) VALUES (?)', [table_no]);
        const [newTable] = await db.query('SELECT * FROM restaurant_tables WHERE id = ?', [result.insertId]);
        res.status(201).json({ success: true, data: newTable[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
