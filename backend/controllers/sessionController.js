const { db } = require('../config/db');
const { logAction } = require('../utils/logger');
const { generateInvoiceNo } = require('../utils/invoiceHelper');

// Helper to generate session number
const generateSessionNo = () => {
    return 'SES-' + Date.now().toString().slice(-6);
};

// Helper to get system settings
const getSystemSettings = async (connection) => {
    const [rows] = await connection.query('SELECT * FROM settings');
    return rows.reduce((acc, s) => {
        acc[s.setting_key] = s.setting_value;
        return acc;
    }, {});
};

// @desc    Open a new table session
// @route   POST /api/table-sessions/start
// @access  Private
exports.openSession = async (req, res) => {
    const { table_id, customer_id } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Check if table is available
        const [tables] = await connection.query('SELECT status FROM restaurant_tables WHERE id = ?', [table_id]);
        if (tables.length === 0) throw new Error('Table not found');
        if (tables[0].status !== 'available') throw new Error('Table is already occupied');

        // 2. Create session
        const session_no = generateSessionNo();
        const [result] = await connection.query(
            `INSERT INTO table_sessions (session_no, table_id, opened_by)
             VALUES (?, ?, ?)`,
            [session_no, table_id, req.user.id]
        );
        const sessionId = result.insertId;

        // 3. Update table status
        await connection.query('UPDATE restaurant_tables SET status = "occupied" WHERE id = ?', [table_id]);

        await logAction(req.user.id, 'session_opened', 'table_session', sessionId, null, { table_id, session_no });

        await connection.commit();
        res.status(201).json({ 
            success: true, 
            message: 'Session opened', 
            data: { id: sessionId, session_no } 
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    } finally {
        connection.release();
    }
};

// @desc    Get all open sessions
// @route   GET /api/table-sessions/open
// @access  Private
exports.getOpenSessions = async (req, res) => {
    try {
        const [sessions] = await db.query(
            `SELECT s.*, t.table_no, c.name as customer_name
             FROM table_sessions s
             LEFT JOIN restaurant_tables t ON s.table_id = t.id
             LEFT JOIN customers c ON s.customer_id = c.id
             WHERE s.status = 'open'
             ORDER BY s.opened_at DESC`
        );
        res.json({ success: true, data: sessions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Add items to session
// @route   POST /api/table-sessions/:id/items
// @access  Private
exports.addItemsToSession = async (req, res) => {
    const { items } = req.body;
    const sessionId = req.params.id;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [sessions] = await connection.query('SELECT status FROM table_sessions WHERE id = ?', [sessionId]);
        if (sessions.length === 0) throw new Error('Session not found');
        if (sessions[0].status !== 'open') throw new Error('Session is not open');

        for (const itemInput of items) {
            const [itemData] = await connection.query('SELECT name, price FROM items WHERE id = ?', [itemInput.item_id]);
            if (itemData.length === 0) throw new Error(`Item ID ${itemInput.item_id} not found`);
            
            const realPrice = itemData[0].price;
            const realName = itemData[0].name;
            const total = realPrice * itemInput.qty;

            await connection.query(
                `INSERT INTO order_items (session_id, item_id, item_name, qty, unit_price, total, note, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [sessionId, itemInput.item_id, realName, itemInput.qty, realPrice, total, itemInput.note || null, req.user.id]
            );
        }

        await connection.commit();
        res.status(200).json({ success: true, message: 'Items added to session' });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    } finally {
        connection.release();
    }
};

// @desc    Void item in session
exports.voidSessionItem = async (req, res) => {
    const { order_item_id, reason } = req.body;
    const sessionId = req.params.id;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [items] = await connection.query('SELECT * FROM order_items WHERE id = ? AND session_id = ?', [order_item_id, sessionId]);
        if (items.length === 0) throw new Error('Item not found');

        await connection.query(
            'UPDATE order_items SET status = "voided", note = ? WHERE id = ?',
            [reason ? `VOIDED: ${reason}` : 'VOIDED', order_item_id]
        );

        await logAction(req.user.id, 'item_voided', 'order_item', order_item_id, items[0], { reason });

        await connection.commit();
        res.json({ success: true, message: 'Item voided' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    } finally {
        connection.release();
    }
};

// @desc    Get session details
exports.getSessionDetails = async (req, res) => {
    try {
        const [sessions] = await db.query(
            `SELECT s.*, t.table_no, c.name as customer_name
             FROM table_sessions s
             LEFT JOIN restaurant_tables t ON s.table_id = t.id
             LEFT JOIN customers c ON s.customer_id = c.id
             WHERE s.id = ?`,
            [req.params.id]
        );

        if (sessions.length === 0) return res.status(404).json({ success: false, message: 'Session not found' });

        const [items] = await db.query(
            'SELECT * FROM order_items WHERE session_id = ? AND status != "cancelled"',
            [req.params.id]
        );

        const session = sessions[0];
        session.items = items;

        res.json({ success: true, data: session });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Final Checkout - Pay Now
exports.payNowCheckout = async (req, res) => {
    const sessionId = req.params.id;
    const { 
        discount_type, 
        discount_value, 
        service_charge_enabled, 
        tax_enabled,
        payments 
    } = req.body;
    
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const settings = await getSystemSettings(connection);
        const invoice_no = await generateInvoiceNo(connection, 'INV');

        const [sessions] = await connection.query('SELECT * FROM table_sessions WHERE id = ? AND status = "open"', [sessionId]);
        if (sessions.length === 0) throw new Error('Active session not found');
        const session = sessions[0];

        const [orderItems] = await connection.query(
            'SELECT * FROM order_items WHERE session_id = ? AND status IN ("active", "served")', 
            [sessionId]
        );
        if (orderItems.length === 0) throw new Error('No billable items in session');

        const subtotal = orderItems.reduce((acc, item) => acc + parseFloat(item.total), 0);
        
        let discount_amount = 0;
        if (discount_type === 'percentage') {
            discount_amount = (subtotal * (parseFloat(discount_value) || 0)) / 100;
        } else {
            discount_amount = parseFloat(discount_value) || 0;
        }

        const discountedSubtotal = subtotal - discount_amount;

        // Check Discount Approval Limit
        const discountLimit = parseFloat(settings.discount_approval_limit || 0);
        if (discount_amount > discountLimit && !['admin', 'manager'].includes(req.user.role)) {
            throw new Error(`Discount exceeds approval limit (Max: ${settings.currency_symbol || 'Rs.'} ${discountLimit}). Manager override required.`);
        }
        const taxEnabledSetting = settings.tax_enabled === 'true';
        const scEnabledSetting = settings.service_charge_enabled === 'true';
        
        const taxRate = tax_enabled && taxEnabledSetting ? parseFloat(settings.tax_rate || 0) : 0;
        const scRate = service_charge_enabled && scEnabledSetting ? parseFloat(settings.service_charge_rate || 10) : 0;
        
        const taxAmount = (discountedSubtotal * taxRate) / 100;
        const scAmount = (discountedSubtotal * scRate) / 100;
        const grandTotal = discountedSubtotal + taxAmount + scAmount;

        const [invoiceResult] = await connection.query(
            `INSERT INTO invoices (
                invoice_no, customer_id, table_id, session_id, invoice_type, 
                payment_status, payment_method, subtotal, discount_type, discount_value, discount, 
                tax_rate, tax_amount, service_charge_rate, service_charge_amount,
                grand_total, paid_amount, balance_amount, created_by
            ) VALUES (?, ?, ?, ?, 'table_sale', 'paid', 'split', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
            [
                invoice_no, session.customer_id, session.table_id, sessionId,
                subtotal, discount_type || 'fixed', discount_value || 0, discount_amount,
                taxRate, taxAmount, scRate, scAmount,
                grandTotal, grandTotal, req.user.id
            ]
        );
        const invoiceId = invoiceResult.insertId;

        for (const p of payments) {
            await connection.query(
                `INSERT INTO invoice_payments (invoice_id, payment_method, amount, reference_no)
                 VALUES (?, ?, ?, ?)`,
                [invoiceId, p.payment_method, p.amount, p.reference_no || null]
            );
        }

        for (const item of orderItems) {
            await connection.query(
                `INSERT INTO invoice_items (invoice_id, item_id, item_name, qty, unit_price, total)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [invoiceId, item.item_id, item.item_name, item.qty, item.unit_price, item.total]
            );
            await connection.query('UPDATE order_items SET status = "billed" WHERE id = ?', [item.id]);
        }

        await connection.query(
            'UPDATE table_sessions SET status = "paid", closed_at = CURRENT_TIMESTAMP, closed_by = ? WHERE id = ?', 
            [req.user.id, sessionId]
        );
        await connection.query('UPDATE restaurant_tables SET status = "available" WHERE id = ?', [session.table_id]);

        await logAction(req.user.id, 'session_checkout_paid', 'invoice', invoiceId, null, { invoice_no, grandTotal });

        await connection.commit();
        res.status(201).json({ 
            success: true, 
            message: 'Checkout completed', 
            data: { id: invoiceId, invoice_no, grand_total: grandTotal } 
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Checkout failed' });
    } finally {
        connection.release();
    }
};

// @desc    Split Bill - Partial checkout
// @route   POST /api/table-sessions/:id/split-bill
// @access  Private
exports.splitBill = async (req, res) => {
    const sessionId = req.params.id;
    const { 
        split_type, 
        order_item_ids, 
        split_count, 
        amount, 
        payments,
        discount_type,
        discount_value,
        tax_enabled,
        service_charge_enabled
    } = req.body;
    
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        const settings = await getSystemSettings(connection);

        const [sessions] = await connection.query('SELECT * FROM table_sessions WHERE id = ? AND status = "open"', [sessionId]);
        if (sessions.length === 0) throw new Error('Active session not found');
        const session = sessions[0];

        let billableItems = [];
        let subtotal = 0;

        if (split_type === 'by_items') {
            if (!order_item_ids || order_item_ids.length === 0) throw new Error('No items selected for split');
            const [items] = await connection.query(
                'SELECT * FROM order_items WHERE id IN (?) AND session_id = ? AND status IN ("active", "served")',
                [order_item_ids, sessionId]
            );
            billableItems = items;
            subtotal = billableItems.reduce((acc, item) => acc + parseFloat(item.total), 0);
        } else if (split_type === 'equal') {
            const [allItems] = await connection.query(
                'SELECT SUM(total) as total FROM order_items WHERE session_id = ? AND status IN ("active", "served")',
                [sessionId]
            );
            const totalToSplit = parseFloat(allItems[0].total || 0);
            subtotal = totalToSplit / (split_count || 1);
        } else if (split_type === 'custom_amount') {
            subtotal = parseFloat(amount);
        }

        if (subtotal <= 0) throw new Error('Invalid bill amount');

        let discount_amount = 0;
        if (discount_type === 'percentage') {
            discount_amount = (subtotal * (parseFloat(discount_value) || 0)) / 100;
        } else {
            discount_amount = parseFloat(discount_value) || 0;
        }

        const discountedSubtotal = subtotal - discount_amount;

        // Check Discount Approval Limit
        const discountLimit = parseFloat(settings.discount_approval_limit || 0);
        if (discount_amount > discountLimit && !['admin', 'manager'].includes(req.user.role)) {
            throw new Error(`Discount exceeds approval limit (Max: ${settings.currency_symbol || 'Rs.'} ${discountLimit}). Manager override required.`);
        }
        const taxEnabledSetting = settings.tax_enabled === 'true';
        const scEnabledSetting = settings.service_charge_enabled === 'true';
        
        const taxRate = tax_enabled && taxEnabledSetting ? parseFloat(settings.tax_rate || 0) : 0;
        const scRate = service_charge_enabled && scEnabledSetting ? parseFloat(settings.service_charge_rate || 10) : 0;
        
        const taxAmount = (discountedSubtotal * taxRate) / 100;
        const scAmount = (discountedSubtotal * scRate) / 100;
        const grandTotal = discountedSubtotal + taxAmount + scAmount;

        const invoice_no = await generateInvoiceNo(connection, 'SP');
        const [invoiceResult] = await connection.query(
            `INSERT INTO invoices (
                invoice_no, customer_id, table_id, session_id, invoice_type, 
                payment_status, payment_method, subtotal, discount_type, discount_value, discount, 
                tax_rate, tax_amount, service_charge_rate, service_charge_amount,
                grand_total, paid_amount, created_by
            ) VALUES (?, ?, ?, ?, 'table_sale', 'paid', 'split', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                invoice_no, session.customer_id, session.table_id, sessionId,
                subtotal, discount_type || 'fixed', discount_value || 0, discount_amount,
                taxRate, taxAmount, scRate, scAmount,
                grandTotal, grandTotal, req.user.id
            ]
        );
        const invoiceId = invoiceResult.insertId;

        for (const p of payments) {
            await connection.query(
                'INSERT INTO invoice_payments (invoice_id, payment_method, amount, reference_no) VALUES (?, ?, ?, ?)',
                [invoiceId, p.payment_method, p.amount, p.reference_no || null]
            );
        }

        if (split_type === 'by_items') {
            for (const item of billableItems) {
                await connection.query(
                    'INSERT INTO invoice_items (invoice_id, item_id, item_name, qty, unit_price, total) VALUES (?, ?, ?, ?, ?, ?)',
                    [invoiceId, item.item_id, item.item_name, item.qty, item.unit_price, item.total]
                );
                await connection.query('UPDATE order_items SET status = "billed" WHERE id = ?', [item.id]);
            }
        } else {
            await connection.query(
                'INSERT INTO invoice_items (invoice_id, item_name, qty, unit_price, total) VALUES (?, ?, ?, ?, ?)',
                [invoiceId, `Split Payment (${split_type})`, 1, subtotal, subtotal]
            );
        }

        const [remainingItems] = await connection.query(
            'SELECT COUNT(*) as count FROM order_items WHERE session_id = ? AND status IN ("active", "served")',
            [sessionId]
        );

        let shouldClose = false;
        if (split_type === 'by_items') {
            if (remainingItems[0].count === 0) shouldClose = true;
        } else {
            const [sessionTotals] = await connection.query(
                'SELECT SUM(total) as total FROM order_items WHERE session_id = ? AND status IN ("active", "served", "billed")',
                [sessionId]
            );
            const [billedTotals] = await connection.query(
                'SELECT SUM(subtotal) as total FROM invoices WHERE session_id = ? AND payment_status != "cancelled"',
                [sessionId]
            );
            const totalNeeded = parseFloat(sessionTotals[0].total || 0);
            const totalBilled = parseFloat(billedTotals[0].total || 0);
            
            if (totalBilled >= totalNeeded - 0.01) {
                shouldClose = true;
                await connection.query('UPDATE order_items SET status = "billed" WHERE session_id = ? AND status IN ("active", "served")', [sessionId]);
            }
        }

        if (shouldClose) {
            await connection.query(
                'UPDATE table_sessions SET status = "paid", closed_at = CURRENT_TIMESTAMP, closed_by = ? WHERE id = ?',
                [req.user.id, sessionId]
            );
            await connection.query('UPDATE restaurant_tables SET status = "available" WHERE id = ?', [session.table_id]);
        }

        await logAction(req.user.id, 'bill_split', 'invoice', invoiceId, null, { split_type, grandTotal });

        await connection.commit();
        res.status(201).json({ success: true, message: 'Split bill processed', data: { id: invoiceId, invoice_no, shouldClose } });
    } catch (error) {
        await connection.rollback();
        console.error('Split Bill Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Split bill failed' });
    } finally {
        connection.release();
    }
};

// @desc    Final Checkout - Add to Credit (Naya)
exports.addToCreditCheckout = async (req, res) => {
    const sessionId = req.params.id;
    const { 
        customer_id,
        discount_type, 
        discount_value, 
        service_charge_enabled, 
        tax_enabled
    } = req.body;
    
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const settings = await getSystemSettings(connection);
        const invoice_no = await generateInvoiceNo(connection, 'INV');

        const [sessions] = await connection.query('SELECT * FROM table_sessions WHERE id = ? AND status = "open"', [sessionId]);
        if (sessions.length === 0) throw new Error('Active session not found');
        const session = sessions[0];

        const finalCustomerId = customer_id || session.customer_id;
        if (!finalCustomerId) throw new Error('Customer required for credit checkout');

        const [orderItems] = await connection.query(
            'SELECT * FROM order_items WHERE session_id = ? AND status IN ("active", "served")', 
            [sessionId]
        );
        if (orderItems.length === 0) throw new Error('No billable items in session');

        const subtotal = orderItems.reduce((acc, item) => acc + parseFloat(item.total), 0);
        
        let discount_amount = 0;
        if (discount_type === 'percentage') {
            discount_amount = (subtotal * (parseFloat(discount_value) || 0)) / 100;
        } else {
            discount_amount = parseFloat(discount_value) || 0;
        }

        const discountedSubtotal = subtotal - discount_amount;

        // Check Discount Approval Limit
        const discountLimit = parseFloat(settings.discount_approval_limit || 0);
        if (discount_amount > discountLimit && !['admin', 'manager'].includes(req.user.role)) {
            throw new Error(`Discount exceeds approval limit (Max: ${settings.currency_symbol || 'Rs.'} ${discountLimit}). Manager override required.`);
        }
        const taxEnabledSetting = settings.tax_enabled === 'true';
        const scEnabledSetting = settings.service_charge_enabled === 'true';
        
        const taxRate = tax_enabled && taxEnabledSetting ? parseFloat(settings.tax_rate || 0) : 0;
        const scRate = service_charge_enabled && scEnabledSetting ? parseFloat(settings.service_charge_rate || 10) : 0;
        
        const taxAmount = (discountedSubtotal * taxRate) / 100;
        const scAmount = (discountedSubtotal * scRate) / 100;
        const grandTotal = discountedSubtotal + taxAmount + scAmount;

        const [invoiceResult] = await connection.query(
            `INSERT INTO invoices (
                invoice_no, customer_id, table_id, session_id, invoice_type, 
                payment_status, payment_method, subtotal, discount_type, discount_value, discount, 
                tax_rate, tax_amount, service_charge_rate, service_charge_amount,
                grand_total, paid_amount, balance_amount, created_by
            ) VALUES (?, ?, ?, ?, 'table_sale', 'unpaid', 'credit', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
            [
                invoice_no, finalCustomerId, session.table_id, sessionId,
                subtotal, discount_type || 'fixed', discount_value || 0, discount_amount,
                taxRate, taxAmount, scRate, scAmount,
                grandTotal, grandTotal, req.user.id
            ]
        );
        const invoiceId = invoiceResult.insertId;

        await connection.query('UPDATE customers SET current_balance = current_balance + ? WHERE id = ?', [grandTotal, finalCustomerId]);
        const [customer] = await connection.query('SELECT current_balance FROM customers WHERE id = ?', [finalCustomerId]);
        
        await connection.query(
            `INSERT INTO customer_ledger (customer_id, invoice_id, type, amount, balance_after, description)
             VALUES (?, ?, 'debit', ?, ?, ?)`,
            [finalCustomerId, invoiceId, grandTotal, customer[0].current_balance, `Credit checkout - Inv: ${invoice_no}`]
        );

        for (const item of orderItems) {
            await connection.query(
                `INSERT INTO invoice_items (invoice_id, item_id, item_name, qty, unit_price, total)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [invoiceId, item.item_id, item.item_name, item.qty, item.unit_price, item.total]
            );
            await connection.query('UPDATE order_items SET status = "billed" WHERE id = ?', [item.id]);
        }

        await connection.query(
            'UPDATE table_sessions SET status = "credit", closed_at = CURRENT_TIMESTAMP, closed_by = ? WHERE id = ?', 
            [req.user.id, sessionId]
        );
        await connection.query('UPDATE restaurant_tables SET status = "available" WHERE id = ?', [session.table_id]);

        await logAction(req.user.id, 'session_checkout_credit', 'invoice', invoiceId, null, { invoice_no, grandTotal, customer_id: finalCustomerId });

        await connection.commit();
        res.status(201).json({ 
            success: true, 
            message: 'Credit checkout completed', 
            data: { id: invoiceId, invoice_no, grand_total: grandTotal } 
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Credit checkout failed' });
    } finally {
        connection.release();
    }
};

exports.getActiveSessionByTable = async (req, res) => {
    try {
        const [sessions] = await db.query(
            'SELECT * FROM table_sessions WHERE table_id = ? AND status = "open" LIMIT 1',
            [req.params.tableId]
        );

        if (sessions.length === 0) return res.json({ success: true, data: null });
        res.json({ success: true, data: sessions[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateSessionItem = async (req, res) => {
    const { qty, note } = req.body;
    const { id: sessionId, itemId } = req.params;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [items] = await connection.query('SELECT unit_price FROM order_items WHERE id = ? AND session_id = ?', [itemId, sessionId]);
        if (items.length === 0) throw new Error('Item not found in session');

        const unitPrice = items[0].unit_price;
        const total = unitPrice * qty;

        await connection.query(
            'UPDATE order_items SET qty = ?, total = ?, note = ? WHERE id = ?',
            [qty, total, note, itemId]
        );

        await connection.commit();
        res.json({ success: true, message: 'Item updated' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    } finally {
        connection.release();
    }
};
