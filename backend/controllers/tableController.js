const Table = require('../models/Table');

// @desc    Get all tables
// @route   GET /api/tables
// @access  Private
exports.getTables = async (req, res) => {
    try {
        const tables = await Table.find().sort({ table_no: 1 });
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
        const table = await Table.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
        res.json({ success: true, message: 'Table status updated', data: table });
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
        const table = await Table.create({ table_no });
        res.status(201).json({ success: true, data: table });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
