const { db } = require('../config/db');
const nayaService = require('../services/nayaAccountService');
const { buildIdOrUuidWhere, generateUuid } = require('../utils/identifier');

// @desc    Add customer payment
// @route   POST /api/payments/customer-payment
// @access  Private
exports.addPayment = async (req, res) => {
    const { customer_id, amount, payment_method, note } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const paymentAmount = parseFloat(amount);
        if (!paymentAmount || paymentAmount <= 0) throw new Error('Invalid payment amount');

        // 1. Get customer
        const where = buildIdOrUuidWhere(null, customer_id);
        const [customers] = await connection.query(`SELECT id FROM customers WHERE ${where.query}`, [where.value]);
        if (customers.length === 0) throw new Error('Customer not found');
        const customer = customers[0];
        const actualCustomerId = customer.id;

        // 2. Insert payment
        const uuid = generateUuid();
        const [paymentResult] = await connection.query(
            `INSERT INTO payments (uuid, customer_id, amount, payment_method, note, created_by)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [uuid, actualCustomerId, paymentAmount, payment_method, note || '', req.user.id]
        );
        const paymentId = paymentResult.insertId;

        // 3. Naya Integration
        const nayaResult = await nayaService.receiveCustomerPayment(connection, {
            customerId: actualCustomerId,
            paymentId: paymentId,
            amount: paymentAmount,
            description: `Customer payment received via ${payment_method}${note ? ' - ' + note : ''}`
        });

        const { logAction } = require('../utils/logger');
        await logAction(req.user.id, 'customer_payment_received', 'customer', actualCustomerId, { old_balance: nayaResult.previousBalance }, { payment_id: paymentId, uuid, amount: paymentAmount, new_balance: nayaResult.newBalance });

        await connection.commit();
        res.status(201).json({ 
            success: true, 
            message: 'Payment recorded successfully', 
            data: { 
                payment_id: paymentId,
                uuid: uuid,
                customer_id: actualCustomerId,
                paid_amount: paymentAmount,
                previous_balance: nayaResult.previousBalance,
                new_balance: nayaResult.newBalance 
            } 
        });

    } catch (error) {
        await connection.rollback();
        console.error('Add Payment Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to add payment' });
    } finally {
        connection.release();
    }
};

// @desc    Get payments for a customer
// @route   GET /api/payments/customer/:customerId
// @access  Private
exports.getCustomerPayments = async (req, res) => {
    try {
        const where = buildIdOrUuidWhere(null, req.params.customerId);
        // First get the customer ID if it's a UUID
        const [customerRows] = await db.query(`SELECT id FROM customers WHERE ${where.query}`, [where.value]);
        if (customerRows.length === 0) return res.status(404).json({ success: false, message: 'Customer not found' });
        const customerId = customerRows[0].id;

        const [payments] = await db.query(
            'SELECT * FROM payments WHERE customer_id = ? ORDER BY created_at DESC', 
            [customerId]
        );
        res.json({ success: true, data: payments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
