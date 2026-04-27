const Customer = require('../models/Customer');
const Ledger = require('../models/Ledger');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
exports.getCustomers = async (req, res) => {
    try {
        const customers = await Customer.find().sort({ name: 1 });
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
        const phoneCheck = await Customer.findOne({ phone });
        if (phoneCheck) {
            return res.status(400).json({ success: false, message: 'Phone number already exists' });
        }

        const customer = await Customer.create({
            name,
            phone,
            address,
            nic,
            credit_limit: parseFloat(credit_limit) || 0
        });
        res.status(201).json({ success: true, data: customer });
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
        const ledger = await Ledger.find({ customer_id: req.params.id }).sort({ createdAt: -1 });
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
        const customer = await Customer.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
        res.json({ success: true, message: 'Customer status updated', data: customer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
