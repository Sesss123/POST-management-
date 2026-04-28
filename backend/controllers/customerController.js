const { db } = require('../config/db');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
exports.getCustomers = async (req, res) => {
    try {
        const [customers] = await db.query('SELECT * FROM customers ORDER BY name ASC');
        res.json({ success: true, data: customers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
exports.createCustomer = async (req, res) => {
    const { name, phone, address, nic, credit_limit } = req.body;

    try {
        // Check for duplicate phone number
        const [phoneCheck] = await db.query('SELECT id FROM customers WHERE phone = ?', [phone]);
        if (phoneCheck.length > 0) {
            return res.status(400).json({ success: false, message: 'Phone number already exists' });
        }

        const [result] = await db.query(
            'INSERT INTO customers (name, phone, address, nic, credit_limit) VALUES (?, ?, ?, ?, ?)',
            [name, phone, address, nic, parseFloat(credit_limit) || 0]
        );
        
        const [newCustomer] = await db.query('SELECT * FROM customers WHERE id = ?', [result.insertId]);
        res.status(201).json({ success: true, data: newCustomer[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get customer ledger
// @route   GET /api/customers/:id/ledger
// @access  Private
exports.getCustomerLedger = async (req, res) => {
    try {
        const [ledger] = await db.query('SELECT * FROM customer_ledger WHERE customer_id = ? ORDER BY created_at DESC', [req.params.id]);
        res.json({ success: true, data: ledger });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update customer status
// @route   PATCH /api/customers/:id/status
// @access  Private/Admin
exports.updateCustomerStatus = async (req, res) => {
    const { status } = req.body;
    try {
        await db.query('UPDATE customers SET status = ? WHERE id = ?', [status, req.params.id]);
        
        const [updatedCustomer] = await db.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
        if (updatedCustomer.length === 0) return res.status(404).json({ success: false, message: 'Customer not found' });
        
        res.json({ success: true, message: 'Customer status updated', data: updatedCustomer[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
