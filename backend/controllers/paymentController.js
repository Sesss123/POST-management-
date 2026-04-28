const { db } = require('../config/db');

// @desc    Add customer payment
// @route   POST /api/payments/customer-payment
// @access  Private
exports.addPayment = async (req, res) => {
    const { customer_id, amount, payment_method, note } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Get customer
        const [customers] = await connection.query('SELECT * FROM customers WHERE id = ?', [customer_id]);
        if (customers.length === 0) throw new Error('Customer not found');
        const customer = customers[0];

        // 2. Insert payment
        const [paymentResult] = await connection.query(
            `INSERT INTO payments (customer_id, amount, payment_method, note, created_by)
             VALUES (?, ?, ?, ?, ?)`,
            [customer_id, parseFloat(amount), payment_method, note || '', req.user.id]
        );
        const paymentId = paymentResult.insertId;

        // 3. Update customer balance
        const newBalance = customer.current_balance - parseFloat(amount);
        await connection.query('UPDATE customers SET current_balance = ? WHERE id = ?', [newBalance, customer_id]);

        // 4. Insert ledger record
        await connection.query(
            `INSERT INTO customer_ledger (customer_id, payment_id, type, amount, balance_after, description)
             VALUES (?, ?, 'credit', ?, ?, ?)`,
            [
                customer_id, 
                paymentId, 
                parseFloat(amount), 
                newBalance, 
                `Payment received. Method: ${payment_method}`
            ]
        );

        await connection.commit();
        res.status(201).json({ 
            success: true, 
            message: 'Payment added successfully', 
            data: { newBalance } 
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);
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
        const [payments] = await db.query(
            'SELECT * FROM payments WHERE customer_id = ? ORDER BY created_at DESC', 
            [req.params.customerId]
        );
        res.json({ success: true, data: payments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
