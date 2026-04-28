const { db } = require('../config/db');
const { generateInvoiceNo } = require('../utils/invoiceHelper');

// @desc    Hold a bill (Park bill)
// @route   POST /api/held-bills
// @access  Private
exports.holdBill = async (req, res) => {
    const { reference_name, items, subtotal } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Insert into held_bills
        const [heldResult] = await connection.query(
            'INSERT INTO held_bills (reference_name, subtotal, status, created_by) VALUES (?, ?, ?, ?)',
            [reference_name || `Ref-${Date.now().toString().slice(-4)}`, subtotal, 'held', req.user.id]
        );

        const heldBillId = heldResult.insertId;

        // 2. Insert items
        for (const item of items) {
            await connection.query(
                'INSERT INTO held_bill_items (held_bill_id, item_id, item_name, qty, unit_price) VALUES (?, ?, ?, ?, ?)',
                [heldBillId, item.id || item.item_id, item.name || item.item_name, item.qty, item.price || item.unit_price]
            );
        }

        await connection.commit();
        res.status(201).json({ success: true, message: 'Bill held successfully', data: { id: heldBillId } });

    } catch (error) {
        await connection.rollback();
        console.error('Hold Bill Error:', error);
        res.status(500).json({ success: false, message: 'Failed to hold bill' });
    } finally {
        connection.release();
    }
};

// @desc    Get all active held bills
// @route   GET /api/held-bills
// @access  Private
exports.getHeldBills = async (req, res) => {
    try {
        const [bills] = await db.query(
            "SELECT h.*, u.name as created_by_name FROM held_bills h LEFT JOIN users u ON h.created_by = u.id WHERE h.status = 'held' ORDER BY h.created_at DESC"
        );
        res.json({ success: true, data: bills });
    } catch (error) {
        console.error('Get Held Bills Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get held bill details to resume
// @route   GET /api/held-bills/:id
// @access  Private
exports.getHeldBillById = async (req, res) => {
    try {
        const [bills] = await db.query('SELECT * FROM held_bills WHERE id = ?', [req.params.id]);
        if (bills.length === 0) {
            return res.status(404).json({ success: false, message: 'Held bill not found' });
        }

        const [items] = await db.query('SELECT * FROM held_bill_items WHERE held_bill_id = ?', [req.params.id]);
        
        res.json({ success: true, data: { ...bills[0], items } });
    } catch (error) {
        console.error('Get Held Bill By ID Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Cancel held bill
// @route   PATCH /api/held-bills/:id/cancel
// @access  Private
exports.cancelHeldBill = async (req, res) => {
    const { reason } = req.body;
    if (!reason) {
        return res.status(400).json({ success: false, message: 'Reason is required for cancellation' });
    }

    try {
        const [result] = await db.query(
            "UPDATE held_bills SET status = 'cancelled', cancel_reason = ? WHERE id = ? AND status = 'held'",
            [reason, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Held bill not found or already processed' });
        }

        res.json({ success: true, message: 'Held bill cancelled' });
    } catch (error) {
        console.error('Cancel Held Bill Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Complete held bill (Direct checkout)
// @route   POST /api/held-bills/:id/complete
// @access  Private
exports.completeHeldBill = async (req, res) => {
    const { payment_method, discount_type, discount_value, tax_enabled, service_charge_enabled } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Get held bill and items
        const [bills] = await connection.query("SELECT * FROM held_bills WHERE id = ? AND status = 'held'", [req.params.id]);
        if (bills.length === 0) throw new Error('Held bill not found');

        const [heldItems] = await connection.query('SELECT * FROM held_bill_items WHERE held_bill_id = ?', [req.params.id]);

        // 2. Recalculate totals from database (Never trust frontend)
        let subtotal = 0;
        for (const item of heldItems) {
            const [dbItems] = await connection.query('SELECT price FROM items WHERE id = ?', [item.item_id]);
            const price = dbItems.length > 0 ? dbItems[0].price : item.unit_price;
            subtotal += price * item.qty;
        }

        // 3. Get system settings for tax/sc
        const [settingsRows] = await connection.query('SELECT key_name, value FROM settings WHERE key_name IN ("tax_rate", "service_charge_rate")');
        const settings = {};
        settingsRows.forEach(row => settings[row.key_name] = parseFloat(row.value));

        let discount = 0;
        if (discount_type === 'percentage') {
            discount = (subtotal * (parseFloat(discount_value) || 0)) / 100;
        } else {
            discount = parseFloat(discount_value) || 0;
        }

        const discountedSubtotal = subtotal - discount;
        const tax_amount = tax_enabled ? (discountedSubtotal * (settings.tax_rate || 0)) / 100 : 0;
        const service_charge_amount = service_charge_enabled ? (discountedSubtotal * (settings.service_charge_rate || 0)) / 100 : 0;
        const grand_total = discountedSubtotal + tax_amount + service_charge_amount;

        // 4. Create Invoice
        const invoiceNo = await generateInvoiceNo(connection, 'CS');
        const [invResult] = await connection.query(
            `INSERT INTO invoices 
            (invoice_no, invoice_type, payment_status, payment_method, subtotal, discount_type, discount_value, discount, tax_rate, tax_amount, service_charge_rate, service_charge_amount, grand_total, paid_amount, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [invoiceNo, 'cash_sale', 'paid', payment_method || 'cash', subtotal, discount_type || 'fixed', discount_value || 0, discount, settings.tax_rate || 0, tax_amount, settings.service_charge_rate || 0, service_charge_amount, grand_total, grand_total, req.user.id]
        );

        const invoiceId = invResult.insertId;

        // 5. Insert Invoice Items
        for (const item of heldItems) {
            const [dbItems] = await connection.query('SELECT price FROM items WHERE id = ?', [item.item_id]);
            const price = dbItems.length > 0 ? dbItems[0].price : item.unit_price;
            await connection.query(
                'INSERT INTO invoice_items (invoice_id, item_id, item_name, qty, unit_price, total) VALUES (?, ?, ?, ?, ?, ?)',
                [invoiceId, item.item_id, item.item_name, item.qty, price, price * item.qty]
            );
        }

        // 6. Insert Payment
        await connection.query(
            'INSERT INTO invoice_payments (invoice_id, payment_method, amount) VALUES (?, ?, ?)',
            [invoiceId, payment_method || 'cash', grand_total]
        );

        // 7. Update Held Bill status
        await connection.query("UPDATE held_bills SET status = 'completed' WHERE id = ?", [req.params.id]);

        await connection.commit();
        res.json({ success: true, message: 'Held bill completed successfully', data: { invoice_id: invoiceId, invoice_no: invoiceNo } });

    } catch (error) {
        await connection.rollback();
        console.error('Complete Held Bill Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to complete held bill' });
    } finally {
        connection.release();
    }
};
