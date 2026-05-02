const { db } = require('../config/db');

// @desc    Open a new shift
// @route   POST /api/shifts/open
// @access  Private
exports.openShift = async (req, res) => {
    const { opening_cash } = req.body;

    try {
        // Check if there is already an open shift for this user
        const [openShifts] = await db.query(
            "SELECT id FROM shifts WHERE user_id = ? AND status = 'open'",
            [req.user.id]
        );

        if (openShifts.length > 0) {
            return res.status(400).json({ success: false, message: 'You already have an open shift' });
        }

        const [result] = await db.query(
            'INSERT INTO shifts (user_id, opening_cash, status) VALUES (?, ?, ?)',
            [req.user.id, opening_cash || 0, 'open']
        );

        const { logAction } = require('../utils/logger');
        await logAction(req.user.id, 'shift_opened', 'shift', result.insertId, null, { opening_cash });

        res.status(201).json({ success: true, message: 'Shift opened successfully', data: { id: result.insertId } });
    } catch (error) {
        console.error('Open Shift Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get current open shift for user
// @route   GET /api/shifts/current
// @access  Private
exports.getCurrentShift = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const [shifts] = await connection.query(
            "SELECT * FROM shifts WHERE user_id = ? AND status = 'open' LIMIT 1",
            [req.user.id]
        );

        if (shifts.length === 0) {
            return res.json({ success: true, data: null });
        }

        const shift = shifts[0];

        // Calculate expected cash
        // expected = opening + cash_sales + credit_payments_cash + cash_in - cash_out
        
        // 1. Cash Sales (from invoice_payments)
        const [cashSales] = await connection.query(
            `SELECT SUM(ip.amount) as total 
             FROM invoice_payments ip 
             JOIN invoices i ON ip.invoice_id = i.id 
             WHERE i.created_by = ? AND ip.payment_method = 'cash' AND ip.created_at >= ?`,
            [req.user.id, shift.start_time]
        );

        // 2. Customer Credit Payments (from payments table)
        const [creditPayments] = await connection.query(
            "SELECT SUM(amount) as total FROM payments WHERE created_by = ? AND payment_method = 'cash' AND created_at >= ?",
            [req.user.id, shift.start_time]
        );

        // 3. Cash Movements (In/Out)
        const [movements] = await connection.query(
            "SELECT type, SUM(amount) as total FROM cash_movements WHERE shift_id = ? GROUP BY type",
            [shift.id]
        );

        let cashIn = 0;
        let cashOut = 0;
        movements.forEach(m => {
            if (m.type === 'cash_in') cashIn = m.total;
            if (m.type === 'cash_out') cashOut = m.total;
        });

        const expectedCash = parseFloat(shift.opening_cash) + 
                            parseFloat(cashSales[0].total || 0) + 
                            parseFloat(creditPayments[0].total || 0) + 
                            parseFloat(cashIn) - 
                            parseFloat(cashOut);

        res.json({ success: true, data: { ...shift, expected_cash: expectedCash } });
    } catch (error) {
        console.error('Get Current Shift Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        connection.release();
    }
};

// @desc    Close current shift
// @route   POST /api/shifts/close
// @access  Private
exports.closeShift = async (req, res) => {
    const { actual_cash, note } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [shifts] = await connection.query(
            "SELECT * FROM shifts WHERE user_id = ? AND status = 'open' LIMIT 1",
            [req.user.id]
        );

        if (shifts.length === 0) {
            throw new Error('No open shift found');
        }

        const shift = shifts[0];

        // Recalculate expected cash for the final closure
        const [cashSales] = await connection.query(
            `SELECT SUM(ip.amount) as total 
             FROM invoice_payments ip 
             JOIN invoices i ON ip.invoice_id = i.id 
             WHERE i.created_by = ? AND ip.payment_method = 'cash' AND ip.created_at >= ?`,
            [req.user.id, shift.start_time]
        );

        const [creditPayments] = await connection.query(
            "SELECT SUM(amount) as total FROM payments WHERE created_by = ? AND payment_method = 'cash' AND created_at >= ?",
            [req.user.id, shift.start_time]
        );

        const [movements] = await connection.query(
            "SELECT type, SUM(amount) as total FROM cash_movements WHERE shift_id = ? GROUP BY type",
            [shift.id]
        );

        let cashIn = 0;
        let cashOut = 0;
        movements.forEach(m => {
            if (m.type === 'cash_in') cashIn = m.total;
            if (m.type === 'cash_out') cashOut = m.total;
        });

        const expectedCash = parseFloat(shift.opening_cash) + 
                            parseFloat(cashSales[0].total || 0) + 
                            parseFloat(creditPayments[0].total || 0) + 
                            parseFloat(cashIn) - 
                            parseFloat(cashOut);

        const difference = parseFloat(actual_cash) - expectedCash;

        await connection.query(
            "UPDATE shifts SET status = 'closed', end_time = CURRENT_TIMESTAMP, actual_cash = ?, expected_cash = ?, difference = ?, note = ? WHERE id = ?",
            [actual_cash, expectedCash, difference, note, shift.id]
        );

        const { logAction } = require('../utils/logger');
        await logAction(req.user.id, 'shift_closed', 'shift', shift.id, null, { actual_cash, expected_cash: expectedCash, difference });
        
        if (Math.abs(difference) > 0) {
            await logAction(req.user.id, 'cash_mismatch_detected', 'shift', shift.id, null, { difference });
        }

        await connection.commit();
        res.json({ success: true, message: 'Shift closed successfully', data: { expected_cash: expectedCash, difference } });
    } catch (error) {
        await connection.rollback();
        console.error('Close Shift Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    } finally {
        connection.release();
    }
};

// @desc    Record cash movement
// @route   POST /api/shifts/cash-movement
// @access  Private
exports.recordCashMovement = async (req, res) => {
    const { type, amount, reason } = req.body;

    try {
        const [shifts] = await db.query(
            "SELECT id FROM shifts WHERE user_id = ? AND status = 'open' LIMIT 1",
            [req.user.id]
        );

        if (shifts.length === 0) {
            return res.status(400).json({ success: false, message: 'No open shift found' });
        }

        await db.query(
            'INSERT INTO cash_movements (shift_id, user_id, type, amount, reason) VALUES (?, ?, ?, ?, ?)',
            [shifts[0].id, req.user.id, type, amount, reason]
        );

        const { logAction } = require('../utils/logger');
        await logAction(req.user.id, 'cash_movement_created', 'cash_movement', shifts[0].id, null, { type, amount, reason });

        res.status(201).json({ success: true, message: 'Cash movement recorded' });
    } catch (error) {
        console.error('Cash Movement Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get shift history
// @route   GET /api/shifts
// @access  Private
exports.getShifts = async (req, res) => {
    try {
        let query = "SELECT s.*, u.name as user_name FROM shifts s JOIN users u ON s.user_id = u.id ";
        let params = [];

        if (req.user.role !== 'admin') {
            query += " WHERE s.user_id = ? ";
            params.push(req.user.id);
        }

        query += " ORDER BY s.start_time DESC LIMIT 50";

        const [shifts] = await db.query(query, params);
        res.json({ success: true, data: shifts });
    } catch (error) {
        console.error('Get Shifts Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
