const { db } = require('../config/db');
const { generateUuid } = require('../utils/identifier');
const { logAction } = require('../utils/logger');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
exports.getExpenses = async (req, res) => {
    const { from, to, category, payment_method, status } = req.query;
    try {
        let sql = `
            SELECT e.*, u.name as created_by_name 
            FROM expenses e 
            LEFT JOIN users u ON e.created_by = u.id 
            WHERE e.shop_id = ?
        `;
        const params = [req.shopId];

        if (from && to) {
            sql += ' AND e.expense_date BETWEEN ? AND ?';
            params.push(from, to);
        } else if (from) {
            sql += ' AND e.expense_date >= ?';
            params.push(from);
        }

        if (category && category !== 'all') {
            sql += ' AND e.category = ?';
            params.push(category);
        }

        if (payment_method && payment_method !== 'all') {
            sql += ' AND e.payment_method = ?';
            params.push(payment_method);
        }

        if (status && status !== 'all') {
            sql += ' AND e.status = ?';
            params.push(status);
        } else {
            sql += " AND e.status = 'active'";
        }

        sql += ' ORDER BY e.expense_date DESC, e.created_at DESC';

        const [expenses] = await db.query(sql, params);
        
        // Get category summary
        const [summary] = await db.query(`
            SELECT category, SUM(amount) as total 
            FROM expenses 
            WHERE shop_id = ? AND status = 'active' AND expense_date = CURDATE()
            GROUP BY category
        `, [req.shopId]);

        res.json({ success: true, data: expenses, today_summary: summary });
    } catch (error) {
        console.error('Get Expenses Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
exports.createExpense = async (req, res) => {
    const { category, amount, payment_method, paid_from_cash_drawer, note, expense_date } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Get Settings
        const [settingsRows] = await connection.query('SELECT setting_key, setting_value FROM settings WHERE shop_id = ? AND setting_group = "expenses"', [req.shopId]);
        const settings = settingsRows.reduce((acc, s) => { acc[s.setting_key] = s.setting_value; return acc; }, {});

        if (settings.expenses_enabled === 'false') {
            throw new Error('Expense tracking is disabled for this shop');
        }

        if (req.user.role === 'cashier' && settings.cashier_can_add_expense === 'false') {
            throw new Error('You do not have permission to add expenses');
        }

        if (settings.expense_requires_reason === 'true' && !note) {
            throw new Error('Expense note/reason is required');
        }

        // 2. Generate Expense No
        const [[{ count }]] = await connection.query('SELECT COUNT(*) as count FROM expenses WHERE shop_id = ? AND DATE(created_at) = CURDATE()', [req.shopId]);
        const expense_no = `EXP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${(count + 1).toString().padStart(3, '0')}`;
        
        const uuid = generateUuid();
        const date = expense_date || new Date().toISOString().split('T')[0];

        // 3. Insert Expense
        const [result] = await connection.query(
            `INSERT INTO expenses (uuid, shop_id, expense_no, category, amount, payment_method, paid_from_cash_drawer, note, expense_date, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [uuid, req.shopId, expense_no, category, amount, payment_method || 'cash', paid_from_cash_drawer ? 1 : 0, note, date, req.user.id]
        );

        // 4. Audit Log
        await logAction(req.user.id, 'expense_created', 'expense', result.insertId, null, req.body);

        // 5. Handle Cash Drawer impact if applicable
        if (paid_from_cash_drawer && payment_method === 'cash') {
            // Check for open shift
            const [openShifts] = await connection.query(
                "SELECT id FROM shifts WHERE user_id = ? AND status = 'open' AND shop_id = ? LIMIT 1",
                [req.user.id, req.shopId]
            );

            if (openShifts.length > 0) {
                // Record a cash movement (out) for the expense
                await connection.query(
                    'INSERT INTO cash_movements (shift_id, user_id, type, amount, reason, shop_id) VALUES (?, ?, ?, ?, ?, ?)',
                    [openShifts[0].id, req.user.id, 'cash_out', amount, `Expense: ${category} (${expense_no})`, req.shopId]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ success: true, message: 'Expense recorded successfully', data: { id: result.insertId, expense_no } });
    } catch (error) {
        await connection.rollback();
        console.error('Create Expense Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    } finally {
        connection.release();
    }
};

// @desc    Get expense by identifier
// @route   GET /api/expenses/:identifier
// @access  Private
exports.getExpense = async (req, res) => {
    try {
        const identifier = req.params.identifier;
        const [expenses] = await db.query(
            `SELECT e.*, u.name as created_by_name 
             FROM expenses e 
             LEFT JOIN users u ON e.created_by = u.id 
             WHERE (e.id = ? OR e.uuid = ? OR e.expense_no = ?) AND e.shop_id = ?`,
            [identifier, identifier, identifier, req.shopId]
        );

        if (expenses.length === 0) {
            return res.status(404).json({ success: false, message: 'Expense not found' });
        }

        res.json({ success: true, data: expenses[0] });
    } catch (error) {
        console.error('Get Expense Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private/Admin
exports.updateExpense = async (req, res) => {
    const { category, amount, note, expense_date } = req.body;
    try {
        const [oldExpense] = await db.query('SELECT * FROM expenses WHERE id = ? AND shop_id = ?', [req.params.id, req.shopId]);
        if (oldExpense.length === 0) return res.status(404).json({ success: false, message: 'Expense not found' });

        await db.query(
            'UPDATE expenses SET category = ?, amount = ?, note = ?, expense_date = ? WHERE id = ? AND shop_id = ?',
            [category, amount, note, expense_date, req.params.id, req.shopId]
        );

        await logAction(req.user.id, 'expense_updated', 'expense', req.params.id, oldExpense[0], req.body);

        res.json({ success: true, message: 'Expense updated' });
    } catch (error) {
        console.error('Update Expense Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Cancel/Void expense
// @route   PATCH /api/expenses/:id/cancel
// @access  Private/Admin
exports.cancelExpense = async (req, res) => {
    try {
        const [oldExpense] = await db.query('SELECT * FROM expenses WHERE id = ? AND shop_id = ?', [req.params.id, req.shopId]);
        if (oldExpense.length === 0) return res.status(404).json({ success: false, message: 'Expense not found' });

        await db.query("UPDATE expenses SET status = 'cancelled' WHERE id = ? AND shop_id = ?", [req.params.id, req.shopId]);

        await logAction(req.user.id, 'expense_cancelled', 'expense', req.params.id, oldExpense[0], null);

        res.json({ success: true, message: 'Expense cancelled' });
    } catch (error) {
        console.error('Cancel Expense Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
