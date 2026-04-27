const Item = require('../models/Item');

// @desc    Get all active items
// @route   GET /api/items
// @access  Private
exports.getItems = async (req, res) => {
    try {
        const items = await Item.find({ status: 'active' });
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
        const item = await Item.create({
            name,
            category,
            price: parseFloat(price),
            stock_qty: parseInt(stock_qty) || 0
        });
        res.status(201).json({ success: true, data: item });
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
        const item = await Item.findByIdAndUpdate(
            req.params.id,
            { name, category, price: parseFloat(price), stock_qty: parseInt(stock_qty), status },
            { new: true, runValidators: true }
        );
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        res.json({ success: true, message: 'Item updated successfully', data: item });
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
        const item = await Item.findByIdAndUpdate(req.params.id, { status: 'inactive' });
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        res.json({ success: true, message: 'Item deactivated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
