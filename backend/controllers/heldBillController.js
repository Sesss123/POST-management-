const { db } = require('../config/db');
const { generateInvoiceNo } = require('../utils/invoiceHelper');
const { buildIdOrUuidWhere, generateUuid } = require('../utils/identifier');

// @desc    Hold a bill (Park bill)
// @route   POST /api/held-bills
// @access  Private
exports.holdBill = async (req, res) => {
    const { customer_name, customer_phone, note, items, subtotal, discount_value } = req.body;
    
    if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Generate Hold Number: HOLD-YYYYMMDD-0001
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const [[{ count }]] = await connection.query('SELECT COUNT(*) as count FROM held_bills WHERE DATE(created_at) = CURDATE()');
        const holdNo = `HOLD-${today}-${(count + 1).toString().padStart(4, '0')}`;

        // 2. Validate Items and Calculate Totals (Backend Security)
        let calculatedSubtotal = 0;
        for (const item of items) {
            // Check if combo or item
            const table = item.is_combo ? 'combo_meals' : 'items';
            const [dbItem] = await connection.query(`SELECT price, name FROM ${table} WHERE id = ?`, [item.id]);
            if (dbItem.length === 0) throw new Error(`Item/Combo ${item.id} not found`);

            let modifierTotal = 0;
            const itemModifiers = [];

            if (item.modifiers && item.modifiers.length > 0) {
                const modifierIds = item.modifiers.map(m => m.modifier_id || m.id);
                const [dbModifiers] = await connection.query(
                    'SELECT id, name, type, price_delta FROM item_modifiers WHERE id IN (?) AND status = "active"',
                    [modifierIds]
                );

                for (const dbMod of dbModifiers) {
                    const priceDelta = parseFloat(dbMod.price_delta || 0);
                    modifierTotal += priceDelta;
                    itemModifiers.push({
                        modifier_id: dbMod.id,
                        name: dbMod.name,
                        type: dbMod.type,
                        price_delta: priceDelta
                    });
                }
            }

            const itemUnitPrice = parseFloat(dbItem[0].price);
            const itemTotal = (itemUnitPrice + modifierTotal) * item.qty;
            calculatedSubtotal += itemTotal;
            
            item.processed = {
                unit_price: itemUnitPrice,
                modifier_total: modifierTotal,
                total: itemTotal,
                modifiers: itemModifiers,
                name: dbItem[0].name
            };
        }

        // 2.1 Security Check: Discount Approval Limit
        const discount = parseFloat(discount_value) || 0;
        const [limitRows] = await connection.query('SELECT setting_value FROM settings WHERE setting_key = "discount_approval_limit"');
        const discountLimit = limitRows.length > 0 ? parseFloat(limitRows[0].setting_value) : 0;
        
        if (discount > discountLimit && req.user.role !== 'admin') {
            throw new Error(`Discount exceeds approval limit. Admin override required.`);
        }
        if (discount > calculatedSubtotal) throw new Error('Discount cannot be greater than subtotal');

        const grandTotal = calculatedSubtotal - discount;
        const heldUuid = generateUuid();

        // 3. Insert into held_bills
        const [heldResult] = await connection.query(
            `INSERT INTO held_bills 
            (uuid, hold_no, customer_name, customer_phone, note, subtotal, discount, grand_total, status, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [heldUuid, holdNo, customer_name || 'Walk-in Customer', customer_phone || null, note || null, calculatedSubtotal, discount, grandTotal, 'held', req.user.id]
        );

        const heldBillId = heldResult.insertId;

        // 4. Insert items
        for (const item of items) {
            const itemUuid = generateUuid();
            const [itemResult] = await connection.query(
                `INSERT INTO held_bill_items 
                (uuid, held_bill_id, item_id, item_type, combo_id, item_name, portion_type, qty, unit_price, modifier_total, total, note, special_note) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    itemUuid,
                    heldBillId, 
                    item.is_combo ? null : item.id, 
                    item.is_combo ? 'combo' : 'item',
                    item.is_combo ? item.id : null,
                    item.name, 
                    item.portion_type || null,
                    item.qty, 
                    item.processed.unit_price,
                    item.processed.modifier_total,
                    item.processed.total,
                    item.note || null,
                    item.special_note || null
                ]
            );
            
            const heldBillItemId = itemResult.insertId;

            // Save modifiers
            if (item.processed.modifiers.length > 0) {
                for (const mod of item.processed.modifiers) {
                    const modUuid = generateUuid();
                    await connection.query(
                        `INSERT INTO held_bill_item_modifiers (uuid, held_bill_item_id, modifier_id, modifier_name, modifier_type, price_delta)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [modUuid, heldBillItemId, mod.modifier_id, mod.name, mod.type, mod.price_delta]
                    );
                }
            }
        }

        const { logAction } = require('../utils/logger');
        await logAction(req.user.id, 'held_bill_created', 'held_bill', heldBillId, null, { hold_no: holdNo, grand_total: grandTotal });

        await connection.commit();
        res.status(201).json({ 
            success: true, 
            message: `Bill held as ${holdNo}`, 
            data: { id: heldBillId, uuid: heldUuid, hold_no: holdNo } 
        });

    } catch (error) {
        await connection.rollback();
        console.error('Hold Bill Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to hold bill' });
    } finally {
        connection.release();
    }
};

// @desc    Get all held bills with filters
// @route   GET /api/held-bills
// @access  Private
exports.getHeldBills = async (req, res) => {
    const { status = 'held', search } = req.query;
    
    try {
        let sql = "SELECT h.*, u.name as created_by_name FROM held_bills h LEFT JOIN users u ON h.created_by = u.id WHERE 1=1";
        const params = [];

        if (status && status !== 'all') {
            sql += " AND h.status = ?";
            params.push(status);
        }

        if (search) {
            sql += " AND (h.hold_no LIKE ? OR h.customer_name LIKE ? OR h.customer_phone LIKE ?)";
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        sql += " ORDER BY h.created_at DESC";

        const [bills] = await db.query(sql, params);
        res.json({ success: true, data: bills });
    } catch (error) {
        console.error('Get Held Bills Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get held bill details
// @route   GET /api/held-bills/:id
// @access  Private
exports.getHeldBillById = async (req, res) => {
    try {
        const where = buildIdOrUuidWhere(null, req.params.id);
        const [bills] = await db.query(`SELECT * FROM held_bills WHERE ${where.query}`, [where.value]);
        if (bills.length === 0) {
            return res.status(404).json({ success: false, message: 'Held bill not found' });
        }
        const heldBillId = bills[0].id;

        const [items] = await db.query('SELECT * FROM held_bill_items WHERE held_bill_id = ?', [heldBillId]);
        
        for (let item of items) {
            const [itemMods] = await db.query(
                'SELECT modifier_id, modifier_name as name, modifier_type as type, price_delta FROM held_bill_item_modifiers WHERE held_bill_item_id = ?',
                [item.id]
            );
            item.modifiers = itemMods;
        }

        res.json({ success: true, data: { ...bills[0], items } });
    } catch (error) {
        console.error('Get Held Bill By ID Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Resume a held bill
// @route   POST /api/held-bills/:id/resume
// @access  Private
exports.resumeHeldBill = async (req, res) => {
    try {
        const where = buildIdOrUuidWhere(null, req.params.id);
        const [bills] = await db.query(`SELECT * FROM held_bills WHERE ${where.query} AND status IN ('held', 'resumed')`, [where.value]);
        if (bills.length === 0) {
            return res.status(404).json({ success: false, message: 'Held bill not found or already completed/cancelled' });
        }
        const heldBillId = bills[0].id;

        const [items] = await db.query('SELECT * FROM held_bill_items WHERE held_bill_id = ?', [heldBillId]);
        for (let item of items) {
            const [itemMods] = await db.query(
                'SELECT modifier_id, modifier_name as name, modifier_type as type, price_delta FROM held_bill_item_modifiers WHERE held_bill_item_id = ?',
                [item.id]
            );
            item.modifiers = itemMods;
        }

        // Update status to resumed
        await db.query(
            "UPDATE held_bills SET status = 'resumed', resumed_by = ?, resumed_at = CURRENT_TIMESTAMP WHERE id = ?",
            [req.user.id, heldBillId]
        );

        const { logAction } = require('../utils/logger');
        await logAction(req.user.id, 'held_bill_resumed', 'held_bill', heldBillId, null, { hold_no: bills[0].hold_no });

        res.json({ 
            success: true, 
            message: `Resumed ${bills[0].hold_no}`,
            data: { ...bills[0], items } 
        });
    } catch (error) {
        console.error('Resume Held Bill Error:', error);
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
        const where = buildIdOrUuidWhere(null, req.params.id);
        const [oldBill] = await db.query(`SELECT id FROM held_bills WHERE ${where.query} AND status IN ('held', 'resumed')`, [where.value]);
        if (oldBill.length === 0) {
            return res.status(404).json({ success: false, message: 'Held bill not found or already processed' });
        }
        const heldBillId = oldBill[0].id;

        const [result] = await db.query(
            "UPDATE held_bills SET status = 'cancelled', cancel_reason = ?, cancelled_by = ?, cancelled_at = CURRENT_TIMESTAMP WHERE id = ?",
            [reason, req.user.id, heldBillId]
        );

        const { logAction } = require('../utils/logger');
        await logAction(req.user.id, 'held_bill_cancelled', 'held_bill', heldBillId, null, { reason });

        res.json({ success: true, message: 'Held bill cancelled' });
    } catch (error) {
        console.error('Cancel Held Bill Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Complete held bill and create invoice
// @route   POST /api/held-bills/:id/complete
// @access  Private
exports.completeHeldBill = async (req, res) => {
    const { payment_method, cash_received, customer_id, discount_value } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const where = buildIdOrUuidWhere(null, req.params.id);
        // 1. Get held bill
        const [bills] = await connection.query(`SELECT * FROM held_bills WHERE ${where.query} AND status IN ('held', 'resumed')`, [where.value]);
        if (bills.length === 0) throw new Error('Held bill not found or already completed');
        const heldBill = bills[0];
        const heldBillId = heldBill.id;

        // 2. Get items (either from request or from held record)
        const itemsToProcess = req.body.items || null;
        let heldItems = [];
        let subtotal = 0;

        if (itemsToProcess) {
            for (const i of itemsToProcess) {
                const table = i.is_combo ? 'combo_meals' : 'items';
                const [dbItem] = await connection.query(`SELECT price, name FROM ${table} WHERE id = ?`, [i.id]);
                if (dbItem.length === 0) throw new Error(`Item/Combo ${i.id} not found`);

                const realPrice = parseFloat(dbItem[0].price);
                
                let modifierTotal = 0;
                const processedModifiers = [];
                if (i.modifiers && i.modifiers.length > 0) {
                    const modifierIds = i.modifiers.map(m => m.modifier_id || m.id);
                    const [dbModifiers] = await connection.query(
                        'SELECT id, name, type, price_delta FROM item_modifiers WHERE id IN (?) AND status = "active"',
                        [modifierIds]
                    );
                    for (const dbMod of dbModifiers) {
                        const delta = parseFloat(dbMod.price_delta || 0);
                        modifierTotal += delta;
                        processedModifiers.push({
                            modifier_id: dbMod.id,
                            modifier_name: dbMod.name,
                            modifier_type: dbMod.type,
                            price_delta: delta
                        });
                    }
                }

                const itemTotal = (realPrice + modifierTotal) * i.qty;
                subtotal += itemTotal;

                heldItems.push({
                    item_id: i.is_combo ? null : i.id,
                    item_type: i.is_combo ? 'combo' : 'item',
                    combo_id: i.is_combo ? i.id : null,
                    item_name: dbItem[0].name,
                    qty: i.qty,
                    unit_price: realPrice,
                    modifier_total: modifierTotal,
                    total: itemTotal,
                    special_note: i.special_note || null,
                    modifiers: processedModifiers
                });
            }
        } else {
            [heldItems] = await connection.query('SELECT * FROM held_bill_items WHERE held_bill_id = ?', [heldBillId]);
            for (let item of heldItems) {
                const [itemMods] = await connection.query('SELECT * FROM held_bill_item_modifiers WHERE held_bill_item_id = ?', [item.id]);
                item.modifiers = itemMods;
            }
            subtotal = parseFloat(heldBill.subtotal);
        }
        const discount = parseFloat(discount_value !== undefined ? discount_value : heldBill.discount);
        
        // System Settings for Tax/SC/Limits
        const [settingsRows] = await connection.query('SELECT setting_key, setting_value FROM settings WHERE setting_key IN ("tax_rate", "service_charge_rate", "tax_enabled", "service_charge_enabled", "discount_approval_limit")');
        const settings = {};
        settingsRows.forEach(row => settings[row.setting_key] = row.setting_value);

        // Security Check: Discount Approval Limit
        const discountLimit = parseFloat(settings.discount_approval_limit || 0);
        if (discount > discountLimit && req.user.role !== 'admin') {
            throw new Error(`Discount exceeds approval limit. Admin override required.`);
        }
        if (discount > subtotal) throw new Error('Discount cannot be greater than subtotal');

        const tax_enabled = settings.tax_enabled === 'true';
        const sc_enabled = settings.service_charge_enabled === 'true';
        const tax_rate = parseFloat(settings.tax_rate) || 0;
        const sc_rate = parseFloat(settings.service_charge_rate) || 0;

        const discountedSubtotal = Math.max(0, subtotal - discount);
        const tax_amount = tax_enabled ? (discountedSubtotal * tax_rate) / 100 : 0;
        const service_charge_amount = sc_enabled ? (discountedSubtotal * sc_rate) / 100 : 0;
        const grand_total = discountedSubtotal + tax_amount + service_charge_amount;

        // 4. Create Invoice
        const invoiceNo = await generateInvoiceNo(connection, 'CS');
        const invoiceUuid = generateUuid();
        const paymentStatus = payment_method === 'credit' ? 'unpaid' : 'paid';
        const invoiceType = payment_method === 'credit' ? 'credit_sale' : 'cash_sale';

        const [invResult] = await connection.query(
            `INSERT INTO invoices 
            (uuid, invoice_no, invoice_type, payment_status, payment_method, subtotal, discount, tax_rate, tax_amount, service_charge_rate, service_charge_amount, grand_total, paid_amount, customer_id, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                invoiceUuid,
                invoiceNo, 
                invoiceType, 
                paymentStatus, 
                payment_method, 
                subtotal, 
                discount, 
                tax_rate, 
                tax_amount, 
                sc_rate, 
                service_charge_amount, 
                grand_total, 
                payment_method === 'credit' ? 0 : grand_total,
                customer_id || null,
                req.user.id
            ]
        );

        const invoiceId = invResult.insertId;

        // 5. Insert Invoice Items
        for (const item of heldItems) {
            const itemUuid = generateUuid();
            const [invItemResult] = await connection.query(
                'INSERT INTO invoice_items (uuid, invoice_id, item_id, item_type, combo_id, item_name, qty, unit_price, modifier_total, total, special_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [itemUuid, invoiceId, item.item_id, item.item_type, item.combo_id, item.item_name, item.qty, item.unit_price, item.modifier_total || 0, item.total, item.special_note || null]
            );
            const invoiceItemId = invItemResult.insertId;

            // Copy modifiers
            if (item.modifiers && item.modifiers.length > 0) {
                for (const mod of item.modifiers) {
                    const modUuid = generateUuid();
                    await connection.query(
                        'INSERT INTO invoice_item_modifiers (uuid, invoice_item_id, modifier_id, modifier_name, modifier_type, price_delta) VALUES (?, ?, ?, ?, ?, ?)',
                        [modUuid, invoiceItemId, mod.modifier_id, mod.modifier_name || mod.name, mod.modifier_type || mod.type, mod.price_delta]
                    );
                }
            }
        }

        // 6. Handle Payments / Credit
        if (payment_method === 'credit' && customer_id) {
            // Update customer balance
            await connection.query('UPDATE customers SET current_balance = current_balance + ? WHERE id = ?', [grand_total, customer_id]);
            
            // Log to ledger
            const [cust] = await connection.query('SELECT current_balance FROM customers WHERE id = ?', [customer_id]);
            await connection.query(
                'INSERT INTO customer_ledger (customer_id, invoice_id, type, amount, balance_after, description) VALUES (?, ?, ?, ?, ?, ?)',
                [customer_id, invoiceId, 'credit', grand_total, cust[0].current_balance, `Credit sale from ${heldBill.hold_no}`]
            );
        } else {
            // Record Payment
            const payUuid = generateUuid();
            await connection.query(
                'INSERT INTO invoice_payments (uuid, invoice_id, payment_method, amount) VALUES (?, ?, ?, ?)',
                [payUuid, invoiceId, payment_method, grand_total]
            );
        }

        // 7. Update Held Bill
        await connection.query(
            "UPDATE held_bills SET status = 'completed', invoice_id = ?, completed_by = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?",
            [invoiceId, req.user.id, heldBillId]
        );

        const { logAction } = require('../utils/logger');
        await logAction(req.user.id, 'held_bill_completed', 'held_bill', heldBillId, null, { invoice_id: invoiceId, invoice_no: invoiceNo });

        await connection.commit();
        res.json({ 
            success: true, 
            message: 'Held bill completed successfully', 
            data: { invoice_id: invoiceId, invoice_no: invoiceNo } 
        });

    } catch (error) {
        await connection.rollback();
        console.error('Complete Held Bill Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to complete held bill' });
    } finally {
        connection.release();
    }
};
