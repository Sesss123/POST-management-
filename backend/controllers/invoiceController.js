const { db } = require('../config/db');
const { logAction } = require('../utils/logger');

// Helper to generate invoice number
const generateInvoiceNo = () => {
    return 'INV-' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
};

// Helper to get system settings
const getSystemSettings = async (connection) => {
    const [rows] = await connection.query('SELECT * FROM settings');
    return rows.reduce((acc, s) => {
        acc[s.setting_key] = s.setting_value;
        return acc;
    }, {});
};

// @desc    Create Cash Sale
// @route   POST /api/invoices/cash-sale
// @access  Private
exports.createCashSale = async (req, res) => {
    const { items, discount_value, discount_type, payment_method, customer_id } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const settings = await getSystemSettings(connection);
        const invoice_no = generateInvoiceNo();
        
        let subtotal = 0;
        const processedItems = [];

        // 1. Calculate subtotal from real prices (Rule 7)
        for (const itemInput of items) {
            const [itemData] = await connection.query('SELECT name, price FROM items WHERE id = ?', [itemInput.id]);
            if (itemData.length === 0) throw new Error(`Item ID ${itemInput.id} not found`);
            
            const realPrice = itemData[0].price;
            const realName = itemData[0].name;
            const itemTotal = realPrice * itemInput.qty;
            
            subtotal += itemTotal;
            processedItems.push({
                item_id: itemInput.id,
                item_name: realName,
                qty: itemInput.qty,
                unit_price: realPrice,
                total: itemTotal
            });
        }

        // 2. Calculate Discount
        let discount_amount = 0;
        if (discount_type === 'percentage') {
            discount_amount = (subtotal * (parseFloat(discount_value) || 0)) / 100;
        } else {
            discount_amount = parseFloat(discount_value) || 0;
        }

        const discountedSubtotal = subtotal - discount_amount;

        // 2.1 Check Discount Approval Limit
        const discountLimit = parseFloat(settings.discount_approval_limit || 0);
        if (discount_amount > discountLimit && !['admin', 'manager'].includes(req.user.role)) {
            throw new Error(`Discount exceeds approval limit (Max: ${settings.currency_symbol || 'Rs.'} ${discountLimit}). Manager override required.`);
        }

        // 3. Calculate Tax and Service Charge
        const taxEnabled = settings.tax_enabled === 'true';
        const scEnabled = settings.service_charge_enabled === 'true';
        const taxRate = taxEnabled ? parseFloat(settings.tax_rate || 0) : 0;
        const scRate = scEnabled ? parseFloat(settings.service_charge_rate || 0) : 0;
        
        const taxAmount = (discountedSubtotal * taxRate) / 100;
        const scAmount = (discountedSubtotal * scRate) / 100;
        const grand_total = discountedSubtotal + taxAmount + scAmount;

        // 4. Insert Invoice
        const [invoiceResult] = await connection.query(
            `INSERT INTO invoices (
                invoice_no, customer_id, invoice_type, payment_status, 
                payment_method, subtotal, discount_type, discount_value, discount, 
                tax_rate, tax_amount, service_charge_rate, service_charge_amount,
                grand_total, paid_amount, balance_amount, created_by
            ) VALUES (?, ?, 'cash_sale', 'paid', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
            [
                invoice_no, customer_id || null, payment_method || 'cash',
                subtotal, discount_type || 'fixed', discount_value || 0, discount_amount,
                taxRate, taxAmount, scRate, scAmount,
                grand_total, grand_total, req.user.id
            ]
        );

        const invoiceId = invoiceResult.insertId;

        // 5. Insert Items
        for (const item of processedItems) {
            await connection.query(
                `INSERT INTO invoice_items (invoice_id, item_id, item_name, qty, unit_price, total)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [invoiceId, item.item_id, item.item_name, item.qty, item.unit_price, item.total]
            );
        }

        // 6. Log Action
        await logAction(req.user.id, 'cash_sale_created', 'invoice', invoiceId, null, { invoice_no, grand_total });

        await connection.commit();
        res.status(201).json({ 
            success: true, 
            message: 'Cash sale completed', 
            data: { id: invoiceId, invoice_no, grand_total } 
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Failed to process cash sale' });
    } finally {
        connection.release();
    }
};

// @desc    Create Table Sale (Pay Now or Add to Credit)
// @route   POST /api/invoices/table-checkout
// @access  Private
exports.createTableCheckout = async (req, res) => {
    const { session_id, payment_method, discount_value, discount_type, customer_id } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const settings = await getSystemSettings(connection);
        const invoice_no = generateInvoiceNo();

        // 1. Get Session and Table
        const [sessions] = await connection.query('SELECT * FROM table_sessions WHERE id = ? AND status = "open"', [session_id]);
        if (sessions.length === 0) throw new Error('Active session not found');
        const session = sessions[0];

        // 2. Get Order Items
        const [orderItems] = await connection.query('SELECT * FROM order_items WHERE session_id = ? AND status = "active"', [session_id]);
        if (orderItems.length === 0) throw new Error('No active items in session');

        // 3. Calculate Totals (Rule 7)
        let subtotal = orderItems.reduce((acc, item) => acc + parseFloat(item.total), 0);
        
        let discount_amount = 0;
        if (discount_type === 'percentage') {
            discount_amount = (subtotal * (parseFloat(discount_value) || 0)) / 100;
        } else {
            discount_amount = parseFloat(discount_value) || 0;
        }

        const discountedSubtotal = subtotal - discount_amount;

        // 3.1 Check Discount Approval Limit
        const discountLimit = parseFloat(settings.discount_approval_limit || 0);
        if (discount_amount > discountLimit && !['admin', 'manager'].includes(req.user.role)) {
            throw new Error(`Discount exceeds approval limit (Max: ${settings.currency_symbol || 'Rs.'} ${discountLimit}). Manager override required.`);
        }
        const taxEnabled = settings.tax_enabled === 'true';
        const scEnabled = settings.service_charge_enabled === 'true';
        const taxRate = taxEnabled ? parseFloat(settings.tax_rate || 0) : 0;
        const scRate = scEnabled ? parseFloat(settings.service_charge_rate || 0) : 0;
        const taxAmount = (discountedSubtotal * taxRate) / 100;
        const scAmount = (discountedSubtotal * scRate) / 100;
        const grand_total = discountedSubtotal + taxAmount + scAmount;

        const isCredit = payment_method === 'credit';
        const final_customer_id = customer_id || session.customer_id;

        if (isCredit && !final_customer_id) throw new Error('Customer required for credit sale');

        // 4. Create Invoice
        const [invoiceResult] = await connection.query(
            `INSERT INTO invoices (
                invoice_no, customer_id, table_id, session_id, invoice_type, 
                payment_status, payment_method, subtotal, discount_type, discount_value, discount, 
                tax_rate, tax_amount, service_charge_rate, service_charge_amount,
                grand_total, paid_amount, balance_amount, created_by
            ) VALUES (?, ?, ?, ?, 'table_sale', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
            [
                invoice_no, final_customer_id, session.table_id, session_id,
                isCredit ? 'unpaid' : 'paid', payment_method,
                subtotal, discount_type || 'fixed', discount_value || 0, discount_amount,
                taxRate, taxAmount, scRate, scAmount,
                grand_total, isCredit ? 0 : grand_total, req.user.id
            ]
        );
        const invoiceId = invoiceResult.insertId;

        // 5. Insert Items and mark as served/completed
        for (const item of orderItems) {
            await connection.query(
                `INSERT INTO invoice_items (invoice_id, item_id, item_name, qty, unit_price, total)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [invoiceId, item.item_id, item.item_name, item.qty, item.unit_price, item.total]
            );
        }

        // 6. Handle Credit Logic
        if (isCredit) {
            await connection.query('UPDATE customers SET current_balance = current_balance + ? WHERE id = ?', [grand_total, final_customer_id]);
            const [customer] = await connection.query('SELECT current_balance FROM customers WHERE id = ?', [final_customer_id]);
            await connection.query(
                `INSERT INTO customer_ledger (customer_id, invoice_id, type, amount, balance_after, description)
                 VALUES (?, ?, 'debit', ?, ?, ?)`,
                [final_customer_id, invoiceId, grand_total, customer[0].current_balance, `Credit sale - Inv: ${invoice_no}`]
            );
        }

        // 7. Close Session and Table
        await connection.query('UPDATE table_sessions SET status = ?, closed_at = CURRENT_TIMESTAMP, closed_by = ? WHERE id = ?', [isCredit ? 'credit' : 'paid', req.user.id, session_id]);
        await connection.query('UPDATE restaurant_tables SET status = "available" WHERE id = ?', [session.table_id]);

        await logAction(req.user.id, 'invoice_created', 'invoice', invoiceId, null, { invoice_no, grand_total, method: payment_method });

        await connection.commit();
        res.status(201).json({ success: true, message: 'Checkout completed', data: { id: invoiceId, invoice_no, grand_total } });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Checkout failed' });
    } finally {
        connection.release();
    }
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res) => {
    try {
        const query = `
            SELECT i.*, c.name as customer_name, t.table_no, u.name as created_by_name
            FROM invoices i
            LEFT JOIN customers c ON i.customer_id = c.id
            LEFT JOIN restaurant_tables t ON i.table_id = t.id
            LEFT JOIN users u ON i.created_by = u.id
            ORDER BY i.created_at DESC
            LIMIT 100
        `;
        const [invoices] = await db.query(query);
        res.json({ success: true, data: invoices });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get single invoice details
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoiceDetails = async (req, res) => {
    try {
        const [invoices] = await db.query(
            `SELECT i.*, c.name as customer_name, c.phone as customer_phone, t.table_no, u.name as created_by_name
             FROM invoices i
             LEFT JOIN customers c ON i.customer_id = c.id
             LEFT JOIN restaurant_tables t ON i.table_id = t.id
             LEFT JOIN users u ON i.created_by = u.id
             WHERE i.id = ?`,
            [req.params.id]
        );
        
        if (invoices.length === 0) return res.status(404).json({ success: false, message: 'Invoice not found' });
        
        const [items] = await db.query('SELECT * FROM invoice_items WHERE invoice_id = ?', [req.params.id]);
        
        const invoice = invoices[0];
        invoice.items = items;

        // Add restaurant settings for printing
        const [settingsRows] = await db.query('SELECT * FROM settings');
        invoice.settings = settingsRows.reduce((acc, s) => {
            acc[s.setting_key] = s.setting_value;
            return acc;
        }, {});
        
        res.json({ success: true, data: invoice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Cancel Invoice
// @route   PATCH /api/invoices/:id/cancel
// @access  Private/Admin/Manager
exports.cancelInvoice = async (req, res) => {
    const { reason } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [invoices] = await connection.query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
        if (invoices.length === 0) throw new Error('Invoice not found');
        
        const invoice = invoices[0];
        if (invoice.payment_status === 'cancelled') throw new Error('Invoice already cancelled');

        await connection.query(
            'UPDATE invoices SET payment_status = "cancelled", cancel_reason = ? WHERE id = ?',
            [reason, req.params.id]
        );

        // If it was a credit sale, reverse the customer balance
        if (invoice.payment_method === 'credit') {
            await connection.query(
                'UPDATE customers SET current_balance = current_balance - ? WHERE id = ?',
                [invoice.grand_total, invoice.customer_id]
            );

            // Get new balance for ledger
            const [customers] = await connection.query('SELECT current_balance FROM customers WHERE id = ?', [invoice.customer_id]);
            
            await connection.query(
                `INSERT INTO customer_ledger (customer_id, invoice_id, type, amount, balance_after, description)
                 VALUES (?, ?, 'credit', ?, ?, ?)`,
                [
                    invoice.customer_id, 
                    invoice.id, 
                    invoice.grand_total, 
                    customers[0].current_balance, 
                    `REVERSAL - Cancelled Invoice: ${invoice.invoice_no}`
                ]
            );
        }

        await logAction(req.user.id, 'invoice_cancelled', 'invoice', invoice.id, invoice, { reason });

        await connection.commit();
        res.json({ success: true, message: 'Invoice cancelled successfully' });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Failed to cancel invoice' });
    } finally {
        connection.release();
    }
};
// @desc    Split Bill (Partial Payment)
// @route   POST /api/invoices/table-sale/split
// @access  Private
exports.splitBill = async (req, res) => {
    const { session_id, order_item_ids, payment_method, discount_value, discount_type, customer_id } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const settings = await getSystemSettings(connection);
        const invoice_no = generateInvoiceNo();

        // 1. Get Session
        const [sessions] = await connection.query('SELECT * FROM table_sessions WHERE id = ? AND status = "open"', [session_id]);
        if (sessions.length === 0) throw new Error('Active session not found');
        const session = sessions[0];

        // 2. Get Specific Order Items
        const [orderItems] = await connection.query(
            'SELECT * FROM order_items WHERE id IN (?) AND session_id = ? AND status != "billed"', 
            [order_item_ids, session_id]
        );
        if (orderItems.length === 0) throw new Error('No billable items selected');

        // 3. Calculate Totals
        let subtotal = orderItems.reduce((acc, item) => acc + parseFloat(item.total), 0);
        
        let discount_amount = 0;
        if (discount_type === 'percentage') {
            discount_amount = (subtotal * (parseFloat(discount_value) || 0)) / 100;
        } else {
            discount_amount = parseFloat(discount_value) || 0;
        }

        const discountedSubtotal = subtotal - discount_amount;

        // 3.1 Check Discount Approval Limit
        const discountLimit = parseFloat(settings.discount_approval_limit || 0);
        if (discount_amount > discountLimit && !['admin', 'manager'].includes(req.user.role)) {
            throw new Error(`Discount exceeds approval limit (Max: ${settings.currency_symbol || 'Rs.'} ${discountLimit}). Manager override required.`);
        }
        const taxEnabled = settings.tax_enabled === 'true';
        const scEnabled = settings.service_charge_enabled === 'true';
        const taxRate = taxEnabled ? parseFloat(settings.tax_rate || 0) : 0;
        const scRate = scEnabled ? parseFloat(settings.service_charge_rate || 0) : 0;
        const taxAmount = (discountedSubtotal * taxRate) / 100;
        const scAmount = (discountedSubtotal * scRate) / 100;
        const grand_total = discountedSubtotal + taxAmount + scAmount;

        const isCredit = payment_method === 'credit';
        const final_customer_id = customer_id || session.customer_id;

        if (isCredit && !final_customer_id) throw new Error('Customer required for credit sale');

        // 4. Create Invoice
        const [invoiceResult] = await connection.query(
            `INSERT INTO invoices (
                invoice_no, customer_id, table_id, session_id, invoice_type, 
                payment_status, payment_method, subtotal, discount_type, discount_value, discount, 
                tax_rate, tax_amount, service_charge_rate, service_charge_amount,
                grand_total, paid_amount, balance_amount, created_by
            ) VALUES (?, ?, ?, ?, 'table_sale', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
            [
                invoice_no, final_customer_id, session.table_id, session_id,
                isCredit ? 'unpaid' : 'paid', payment_method,
                subtotal, discount_type || 'fixed', discount_value || 0, discount_amount,
                taxRate, taxAmount, scRate, scAmount,
                grand_total, isCredit ? 0 : grand_total, req.user.id
            ]
        );
        const invoiceId = invoiceResult.insertId;

        // 5. Insert Items and mark as billed
        for (const item of orderItems) {
            await connection.query(
                `INSERT INTO invoice_items (invoice_id, item_id, item_name, qty, unit_price, total)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [invoiceId, item.item_id, item.item_name, item.qty, item.unit_price, item.total]
            );
            await connection.query('UPDATE order_items SET status = "billed" WHERE id = ?', [item.id]);
        }

        // 6. Handle Credit Logic
        if (isCredit) {
            await connection.query('UPDATE customers SET current_balance = current_balance + ? WHERE id = ?', [grand_total, final_customer_id]);
            const [customer] = await connection.query('SELECT current_balance FROM customers WHERE id = ?', [final_customer_id]);
            await connection.query(
                `INSERT INTO customer_ledger (customer_id, invoice_id, type, amount, balance_after, description)
                 VALUES (?, ?, 'debit', ?, ?, ?)`,
                [final_customer_id, invoiceId, grand_total, customer[0].current_balance, `Split bill credit - Inv: ${invoice_no}`]
            );
        }

        // 7. Check if session should be closed (if no active items left)
        const [remainingItems] = await connection.query('SELECT id FROM order_items WHERE session_id = ? AND status IN ("active", "served")', [session_id]);
        if (remainingItems.length === 0) {
            await connection.query('UPDATE table_sessions SET status = "paid", closed_at = CURRENT_TIMESTAMP, closed_by = ? WHERE id = ?', [req.user.id, session_id]);
            await connection.query('UPDATE restaurant_tables SET status = "available" WHERE id = ?', [session.table_id]);
        }

        await logAction(req.user.id, 'split_invoice_created', 'invoice', invoiceId, null, { invoice_no, grand_total, method: payment_method });

        await connection.commit();
        res.status(201).json({ success: true, message: 'Split bill completed', data: { id: invoiceId, invoice_no, grand_total } });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Split bill failed' });
    } finally {
        connection.release();
    }
};
