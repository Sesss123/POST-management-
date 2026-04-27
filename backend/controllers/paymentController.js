const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const Ledger = require('../models/Ledger');

// @desc    Add customer payment
// @route   POST /api/payments/customer-payment
// @access  Private
exports.addPayment = async (req, res) => {
    const { customer_id, amount, payment_method, note } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const customer = await Customer.findById(customer_id).session(session);
        if (!customer) throw new Error('Customer not found');

        const payment = await Payment.create([{
            customer_id,
            amount: parseFloat(amount),
            payment_method,
            note: note || '',
            created_by: req.user.id
        }], { session });

        customer.current_balance -= parseFloat(amount);
        await customer.save({ session });

        await Ledger.create([{
            customer_id,
            payment_id: payment[0]._id,
            type: 'credit',
            amount: parseFloat(amount),
            balance_after: customer.current_balance,
            description: `Payment received. Method: ${payment_method}`
        }], { session });

        await session.commitTransaction();
        res.status(201).json({ success: true, message: 'Payment added successfully', data: { newBalance: customer.current_balance } });

    } catch (error) {
        await session.abortTransaction();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Failed to add payment' });
    } finally {
        session.endSession();
    }
};

// @desc    Get payments for a customer
// @route   GET /api/payments/customer/:customerId
// @access  Private
exports.getCustomerPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ customer_id: req.params.customerId }).sort({ createdAt: -1 });
        res.json({ success: true, data: payments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
