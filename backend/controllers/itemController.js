const { db } = require('../config/db');

// @desc    Get all active items
// @route   GET /api/items
// @access  Private
exports.getItems = async (req, res) => {
    try {
        const [items] = await db.query('SELECT * FROM items WHERE status = "active"');
        res.json({ success: true, data: items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create new item
// @route   POST /api/items
// @access  Private/Admin
exports.createItem = async (req, res) => {
    const { name, category, price, stock_qty } = req.body;

    try {
        const [result] = await db.query(
            'INSERT INTO items (name, category, price, stock_qty) VALUES (?, ?, ?, ?)',
            [name, category, parseFloat(price), parseInt(stock_qty) || 0]
        );
        
        const [newItem] = await db.query('SELECT * FROM items WHERE id = ?', [result.insertId]);
        res.status(201).json({ success: true, data: newItem[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update item
// @route   PUT /api/items/:id
// @access  Private/Admin
exports.updateItem = async (req, res) => {
    const { name, category, price, stock_qty, status } = req.body;

    try {
        await db.query(
            'UPDATE items SET name = ?, category = ?, price = ?, stock_qty = ?, status = ? WHERE id = ?',
            [name, category, parseFloat(price), parseInt(stock_qty), status, req.params.id]
        );
        
        const [updatedItem] = await db.query('SELECT * FROM items WHERE id = ?', [req.params.id]);
        if (updatedItem.length === 0) return res.status(404).json({ success: false, message: 'Item not found' });
        
        res.json({ success: true, message: 'Item updated successfully', data: updatedItem[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Deactivate item
// @route   DELETE /api/items/:id
// @access  Private/Admin
exports.deleteItem = async (req, res) => {
    try {
        const [result] = await db.query('UPDATE items SET status = "inactive" WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Item not found' });
        res.json({ success: true, message: 'Item deactivated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
