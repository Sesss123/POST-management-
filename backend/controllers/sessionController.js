const { db } = require('../config/db');
const { logAction } = require('../utils/logger');
const { generateInvoiceNo } = require('../utils/invoiceHelper');
const nayaService = require('../services/nayaAccountService');
const { buildIdOrUuidWhere, generateUuid } = require('../utils/identifier');

// Helper to generate session number
const generateSessionNo = () => {
    return 'SES-' + Date.now().toString().slice(-6);
};

// Helper to get system settings
const getSystemSettings = async (connection, shopId) => {
    const [rows] = await connection.query('SELECT * FROM settings WHERE shop_id = ?', [shopId]);
    return rows.reduce((acc, s) => {
        acc[s.setting_key] = s.setting_value;
        return acc;
    }, {});
};

// @desc    Open a new table session
// @route   POST /api/table-sessions/start
// @access  Private
exports.openSession = async (req, res) => {
    const { table_id, customer_id, order_type = 'dine_in', waiter_id } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Check if table is available
        const [tables] = await connection.query('SELECT status FROM restaurant_tables WHERE id = ? AND shop_id = ?', [table_id, req.shopId]);
        if (tables.length === 0) throw new Error('Table not found');
        if (tables[0].status !== 'available') throw new Error('Table is already occupied');

        // 2. Create session
        const session_no = generateSessionNo();
        const sessionUuid = generateUuid();
        
        let finalWaiterId = waiter_id || null;
        if (!finalWaiterId && req.user.role === 'waiter') {
            finalWaiterId = req.user.id;
        }

        const [result] = await connection.query(
            `INSERT INTO table_sessions (uuid, session_no, table_id, customer_id, opened_by, order_type, waiter_id, shop_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [sessionUuid, session_no, table_id, customer_id || null, req.user.id, order_type, finalWaiterId, req.shopId]
        );
        const sessionId = result.insertId;

        // 3. Update table status
        await connection.query('UPDATE restaurant_tables SET status = "occupied" WHERE id = ? AND shop_id = ?', [table_id, req.shopId]);

        await logAction(req.user.id, 'session_opened', 'table_session', sessionId, null, { table_id, session_no });

        await connection.commit();
        res.status(201).json({ 
            success: true, 
            message: 'Session opened', 
            data: { id: sessionId, uuid: sessionUuid, session_no } 
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
             WHERE s.status = 'open' AND s.shop_id = ?
             ORDER BY s.opened_at DESC`,
            [req.shopId]
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

        const where = buildIdOrUuidWhere('s', sessionId);
        const [sessions] = await connection.query(`SELECT id, status, waiter_id FROM table_sessions s WHERE ${where.query} AND s.shop_id = ?`, [where.value, req.shopId]);
        if (sessions.length === 0) throw new Error('Session not found');
        const sessionInternalId = sessions[0].id;
        if (sessions[0].status !== 'open') throw new Error('Session is not open');
        
        let itemWaiterId = sessions[0].waiter_id || null;
        if (!itemWaiterId && req.user.role === 'waiter') {
            itemWaiterId = req.user.id;
        }

        for (const itemInput of items) {
            let realPrice, realName, comboId = null, itemId = null;
            
            if (itemInput.is_combo) {
                const [comboData] = await connection.query('SELECT name, price, status FROM combo_meals WHERE id = ? AND shop_id = ?', [itemInput.id || itemInput.item_id, req.shopId]);
                if (comboData.length === 0) throw new Error(`Combo ID ${itemInput.id} not found`);
                if (comboData[0].status !== 'active') throw new Error(`Combo ${comboData[0].name} is inactive`);
                
                // Check components
                const [components] = await connection.query(
                    'SELECT i.name, i.availability_status, i.status FROM combo_items ci JOIN items i ON ci.item_id = i.id WHERE ci.combo_id = ? AND ci.shop_id = ?',
                    [itemInput.id || itemInput.item_id, req.shopId]
                );
                for (const comp of components) {
                    if (comp.status !== 'active') throw new Error(`Component ${comp.name} is inactive`);
                    if (comp.availability_status !== 'available') throw new Error(`Component ${comp.name} is ${comp.availability_status.replace('_', ' ')}`);
                }

                realPrice = comboData[0].price;
                realName = comboData[0].name;
                comboId = itemInput.id || itemInput.item_id;
            } else {
                const [itemData] = await connection.query('SELECT name, price, status, availability_status FROM items WHERE id = ? AND shop_id = ?', [itemInput.item_id || itemInput.id, req.shopId]);
                if (itemData.length === 0) throw new Error(`Item ID ${itemInput.item_id || itemInput.id} not found`);
                if (itemData[0].status !== 'active') throw new Error(`Item ${itemData[0].name} is inactive`);
                if (itemData[0].availability_status !== 'available') {
                    throw new Error(`Item ${itemData[0].name} is ${itemData[0].availability_status.replace('_', ' ')}`);
                }
                
                realPrice = itemData[0].price;
                realName = itemData[0].name;
                itemId = itemInput.item_id || itemInput.id;
            }

            let modifierTotal = 0;
            const itemModifiers = [];

            if (itemInput.modifiers && itemInput.modifiers.length > 0) {
                const modifierIds = itemInput.modifiers.map(m => m.modifier_id || m.id);
                const [dbModifiers] = await connection.query(
                    'SELECT id, name, type, price_delta FROM item_modifiers WHERE id IN (?) AND status = "active" AND shop_id = ?',
                    [modifierIds, req.shopId]
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
            
            const itemUnitPrice = realPrice + modifierTotal;
            const total = itemUnitPrice * itemInput.qty;
            const itemUuid = generateUuid();

            const [orderItemResult] = await connection.query(
                `INSERT INTO order_items (uuid, session_id, item_id, combo_id, item_name, qty, unit_price, modifier_total, total, note, special_note, created_by, waiter_id, shop_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [itemUuid, sessionInternalId, itemId, comboId, realName, itemInput.qty, realPrice, modifierTotal, total, itemInput.note || null, itemInput.special_note || null, req.user.id, itemWaiterId, req.shopId]
            );
            const orderItemId = orderItemResult.insertId;

            // Save modifiers
            if (itemModifiers.length > 0) {
                for (const mod of itemModifiers) {
                    const modUuid = generateUuid();
                    await connection.query(
                        `INSERT INTO order_item_modifiers (uuid, order_item_id, modifier_id, modifier_name, modifier_type, price_delta, shop_id)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [modUuid, orderItemId, mod.modifier_id, mod.name, mod.type, mod.price_delta, req.shopId]
                    );
                }
            }
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

        if (!reason) throw new Error('Void reason is required');

        const sessionWhere = buildIdOrUuidWhere('s', sessionId);
        const itemWhere = buildIdOrUuidWhere('oi', order_item_id);

        const [items] = await connection.query(`SELECT oi.* FROM order_items oi JOIN table_sessions s ON oi.session_id = s.id WHERE ${itemWhere.query} AND ${sessionWhere.query} AND oi.shop_id = ? AND s.shop_id = ?`, [...itemWhere.value, ...sessionWhere.value, req.shopId, req.shopId]);
        if (items.length === 0) throw new Error('Item not found');

        const item = items[0];

        const [settings] = await connection.query('SELECT setting_value FROM settings WHERE setting_key = "cashier_void_limit" AND shop_id = ?', [req.shopId]);
        const voidLimit = parseFloat(settings[0]?.setting_value || 2000);

        // Role-based validation
        const userRole = req.user.role;
        const isSent = item.kot_sent || item.status === 'served';
        
        if (isSent) {
            if (userRole === 'cashier') {
                if (parseFloat(item.total) > voidLimit) {
                    throw new Error(`Cashier can only void items up to Rs. ${voidLimit}. This item (Rs. ${item.total}) requires manager approval.`);
                }
            } else if (userRole !== 'admin') {
                throw new Error('Only admin, manager, or authorized cashier can void an item that has already been sent to the kitchen.');
            }
        }

        await connection.query(
            `UPDATE order_items SET status = "voided", void_reason = ?, voided_by = ?, voided_at = CURRENT_TIMESTAMP WHERE id = ? AND shop_id = ?`,
            [reason, req.user.id, item.id, req.shopId]
        );

        await logAction(req.user.id, 'order_item_voided', 'order_item', item.id, null, { reason, item_name: item.item_name });

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
        const where = buildIdOrUuidWhere('s', req.params.id);
        const [sessions] = await db.query(
            `SELECT s.*, t.table_no, c.name as customer_name
             FROM table_sessions s
             LEFT JOIN restaurant_tables t ON s.table_id = t.id
             LEFT JOIN customers c ON s.customer_id = c.id
             WHERE ${where.query} AND s.shop_id = ?`,
            [where.value, req.shopId]
        );

        if (sessions.length === 0) return res.status(404).json({ success: false, message: 'Session not found' });

        const [items] = await db.query(
            'SELECT * FROM order_items WHERE session_id = ? AND status != "cancelled" AND shop_id = ?',
            [req.params.id, req.shopId]
        );

        const session = sessions[0];
        
        // Fetch modifiers for each item
        for (let item of items) {
            const [itemMods] = await db.query(
                'SELECT modifier_id as id, modifier_name as name, modifier_type as type, price_delta FROM order_item_modifiers WHERE order_item_id = ? AND shop_id = ?',
                [item.id, req.shopId]
            );
            item.modifiers = itemMods;
        }
        
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

        const settings = await getSystemSettings(connection, req.shopId);
        const invoice_no = await generateInvoiceNo(connection, 'INV');
        const invoiceUuid = generateUuid();

        const where = buildIdOrUuidWhere('s', sessionId);
        const [sessions] = await connection.query(`SELECT * FROM table_sessions s WHERE ${where.query} AND status = "open" AND shop_id = ?`, [where.value, req.shopId]);
        if (sessions.length === 0) throw new Error('Active session not found');
        const session = sessions[0];
        const sessionInternalId = session.id;

        const [orderItems] = await connection.query(
            'SELECT * FROM order_items WHERE session_id = ? AND status IN ("active", "served") AND shop_id = ?', 
            [sessionInternalId, req.shopId]
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
        if (discount_amount > discountLimit && req.user.role !== 'admin') {
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
                uuid, invoice_no, customer_id, table_id, session_id, invoice_type, order_type, waiter_id,
                payment_status, payment_method, subtotal, discount_type, discount_value, discount, 
                tax_rate, tax_amount, service_charge_rate, service_charge_amount,
                grand_total, paid_amount, balance_amount, created_by, shop_id
            ) VALUES (?, ?, ?, ?, ?, 'table_sale', ?, ?, 'paid', 'split', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
            [
                invoiceUuid,
                invoice_no, session.customer_id, session.table_id, sessionInternalId, session.order_type || 'dine_in', session.waiter_id,
                subtotal, discount_type || 'fixed', discount_value || 0, discount_amount,
                taxRate, taxAmount, scRate, scAmount,
                grandTotal, grandTotal, req.user.id, req.shopId
            ]
        );
        const invoiceId = invoiceResult.insertId;

        for (const p of payments) {
            const payUuid = generateUuid();
            await connection.query(
                `INSERT INTO invoice_payments (uuid, invoice_id, payment_method, amount, reference_no, shop_id)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [payUuid, invoiceId, p.payment_method, p.amount, p.reference_no || null, req.shopId]
            );
        }

        for (const item of orderItems) {
            await connection.query(
                `INSERT INTO invoice_items (invoice_id, item_id, item_name, qty, unit_price, total, shop_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [invoiceId, item.item_id, item.item_name, item.qty, item.unit_price, item.total, req.shopId]
            );
            await connection.query('UPDATE order_items SET status = "billed" WHERE id = ? AND shop_id = ?', [item.id, req.shopId]);
        }

        await connection.query(
            'UPDATE table_sessions SET status = "paid", closed_at = CURRENT_TIMESTAMP, closed_by = ? WHERE id = ? AND shop_id = ?', 
            [req.user.id, sessionInternalId, req.shopId]
        );
        await connection.query('UPDATE restaurant_tables SET status = "available" WHERE id = ? AND shop_id = ?', [session.table_id, req.shopId]);

        await logAction(req.user.id, 'session_checkout_paid', 'invoice', invoiceId, null, { invoice_no, grandTotal });

        await connection.commit();
        res.status(201).json({ 
            success: true, 
            message: 'Checkout completed', 
            data: { id: invoiceId, uuid: invoiceUuid, invoice_no, grand_total: grandTotal } 
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
        const settings = await getSystemSettings(connection, req.shopId);

        const where = buildIdOrUuidWhere('s', sessionId);
        const [sessions] = await connection.query(`SELECT * FROM table_sessions s WHERE ${where.query} AND status = "open" AND shop_id = ?`, [where.value, req.shopId]);
        if (sessions.length === 0) throw new Error('Active session not found');
        const session = sessions[0];
        const sessionInternalId = session.id;

        let billableItems = [];
        let subtotal = 0;

        if (split_type === 'by_items') {
            if (!order_item_ids || order_item_ids.length === 0) throw new Error('No items selected for split');
            const [items] = await connection.query(
                `SELECT * FROM order_items WHERE id IN (?) AND session_id = ? AND status IN ("active", "served") AND shop_id = ?`,
                [order_item_ids, sessionInternalId, req.shopId]
            );
            billableItems = items;
            subtotal = billableItems.reduce((acc, item) => acc + parseFloat(item.total), 0);
        } else if (split_type === 'equal') {
            const [allItems] = await connection.query(
                'SELECT SUM(total) as total FROM order_items WHERE session_id = ? AND status IN ("active", "served") AND shop_id = ?',
                [sessionInternalId, req.shopId]
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
        if (discount_amount > discountLimit && req.user.role !== 'admin') {
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
        const invoiceUuid = generateUuid();
        const [invoiceResult] = await connection.query(
            `INSERT INTO invoices (
                uuid, invoice_no, customer_id, table_id, session_id, invoice_type, order_type, waiter_id,
                payment_status, payment_method, subtotal, discount_type, discount_value, discount, 
                tax_rate, tax_amount, service_charge_rate, service_charge_amount,
                grand_total, paid_amount, created_by, shop_id
            ) VALUES (?, ?, ?, ?, ?, 'table_sale', ?, ?, 'paid', 'split', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                invoiceUuid,
                invoice_no, session.customer_id, session.table_id, sessionInternalId, session.order_type || 'dine_in', session.waiter_id,
                subtotal, discount_type || 'fixed', discount_value || 0, discount_amount,
                taxRate, taxAmount, scRate, scAmount,
                grandTotal, grandTotal, req.user.id, req.shopId
            ]
        );
        const invoiceId = invoiceResult.insertId;

        for (const p of payments) {
            const payUuid = generateUuid();
            await connection.query(
                'INSERT INTO invoice_payments (uuid, invoice_id, payment_method, amount, reference_no, shop_id) VALUES (?, ?, ?, ?, ?, ?)',
                [payUuid, invoiceId, p.payment_method, p.amount, p.reference_no || null, req.shopId]
            );
        }

        if (split_type === 'by_items') {
            for (const item of billableItems) {
                const itemUuid = generateUuid();
                await connection.query(
                    'INSERT INTO invoice_items (uuid, invoice_id, item_id, item_name, qty, unit_price, total, shop_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [itemUuid, invoiceId, item.item_id, item.item_name, item.qty, item.unit_price, item.total, req.shopId]
                );
                await connection.query('UPDATE order_items SET status = "billed" WHERE id = ? AND shop_id = ?', [item.id, req.shopId]);
            }
        } else {
            const itemUuid = generateUuid();
            await connection.query(
                'INSERT INTO invoice_items (uuid, invoice_id, item_name, qty, unit_price, total, shop_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [itemUuid, invoiceId, `Split Payment (${split_type})`, 1, subtotal, subtotal, req.shopId]
            );
        }

        const [remainingItems] = await connection.query(
            'SELECT COUNT(*) as count FROM order_items WHERE session_id = ? AND status IN ("active", "served") AND shop_id = ?',
            [sessionInternalId, req.shopId]
        );

        let shouldClose = false;
        if (split_type === 'by_items') {
            if (remainingItems[0].count === 0) shouldClose = true;
        } else {
            const [sessionTotals] = await connection.query(
                'SELECT SUM(total) as total FROM order_items WHERE session_id = ? AND status IN ("active", "served", "billed") AND shop_id = ?',
                [sessionInternalId, req.shopId]
            );
            const [billedTotals] = await connection.query(
                'SELECT SUM(subtotal) as total FROM invoices WHERE session_id = ? AND payment_status != "cancelled" AND shop_id = ?',
                [sessionInternalId, req.shopId]
            );
            const totalNeeded = parseFloat(sessionTotals[0].total || 0);
            const totalBilled = parseFloat(billedTotals[0].total || 0);
            
            if (totalBilled >= totalNeeded - 0.01) {
                shouldClose = true;
                await connection.query('UPDATE order_items SET status = "billed" WHERE session_id = ? AND status IN ("active", "served") AND shop_id = ?', [sessionInternalId, req.shopId]);
            }
        }

        if (shouldClose) {
            await connection.query(
                'UPDATE table_sessions SET status = "paid", closed_at = CURRENT_TIMESTAMP, closed_by = ? WHERE id = ? AND shop_id = ?',
                [req.user.id, sessionInternalId, req.shopId]
            );
            await connection.query('UPDATE restaurant_tables SET status = "available" WHERE id = ? AND shop_id = ?', [session.table_id, req.shopId]);
        }

        await logAction(req.user.id, 'bill_split', 'invoice', invoiceId, null, { split_type, grandTotal });

        await connection.commit();
        res.status(201).json({ success: true, message: 'Split bill processed', data: { id: invoiceId, uuid: invoiceUuid, invoice_no, shouldClose } });
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

        const settings = await getSystemSettings(connection, req.shopId);
        const invoice_no = await generateInvoiceNo(connection, 'INV');
        const invoiceUuid = generateUuid();

        const where = buildIdOrUuidWhere('s', sessionId);
        const [sessions] = await connection.query(`SELECT * FROM table_sessions s WHERE ${where.query} AND status = "open" AND shop_id = ?`, [where.value, req.shopId]);
        if (sessions.length === 0) throw new Error('Active session not found');
        const session = sessions[0];
        const sessionInternalId = session.id;

        const finalCustomerId = customer_id || session.customer_id;
        if (!finalCustomerId) throw new Error('Customer required for credit checkout');

        const [orderItems] = await connection.query(
            'SELECT * FROM order_items WHERE session_id = ? AND status IN ("active", "served") AND shop_id = ?', 
            [sessionInternalId, req.shopId]
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
        if (discount_amount > discountLimit && req.user.role !== 'admin') {
            throw new Error(`Discount exceeds approval limit (Max: ${settings.currency_symbol || 'Rs.'} ${discountLimit}). Manager override required.`);
        }
        const taxEnabledSetting = settings.tax_enabled === 'true';
        const scEnabledSetting = settings.service_charge_enabled === 'true';
        
        const taxRate = tax_enabled && taxEnabledSetting ? parseFloat(settings.tax_rate || 0) : 0;
        const scRate = service_charge_enabled && scEnabledSetting ? parseFloat(settings.service_charge_rate || 10) : 0;
        
        const taxAmount = (discountedSubtotal * taxRate) / 100;
        const scAmount = (discountedSubtotal * scRate) / 100;
        const grandTotal = discountedSubtotal + taxAmount + scAmount;

        // Validate credit limit before proceeding
        await nayaService.validateCreditLimit(connection, {
            customerId: finalCustomerId,
            amount: grandTotal,
            shopId: req.shopId
        });

        const [invoiceResult] = await connection.query(
            `INSERT INTO invoices (
                uuid, invoice_no, customer_id, table_id, session_id, invoice_type, order_type, waiter_id,
                payment_status, payment_method, subtotal, discount_type, discount_value, discount, 
                tax_rate, tax_amount, service_charge_rate, service_charge_amount,
                grand_total, paid_amount, balance_amount, created_by, shop_id
            ) VALUES (?, ?, ?, ?, ?, 'table_sale', ?, ?, 'unpaid', 'credit', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
            [
                invoiceUuid,
                invoice_no, finalCustomerId, session.table_id, sessionInternalId, session.order_type || 'dine_in', session.waiter_id,
                subtotal, discount_type || 'fixed', discount_value || 0, discount_amount,
                taxRate, taxAmount, scRate, scAmount,
                grandTotal, grandTotal, req.user.id, req.shopId
            ]
        );
        const invoiceId = invoiceResult.insertId;

        const nayaResult = await nayaService.createCreditInvoiceForCustomer(connection, {
            customerId: finalCustomerId,
            invoiceId: invoiceId,
            amount: grandTotal,
            description: `Table bill added to Naya Book - Inv: ${invoice_no}`,
            shopId: req.shopId
        });

        for (const item of orderItems) {
            await connection.query(
                `INSERT INTO invoice_items (invoice_id, item_id, item_name, qty, unit_price, total, shop_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [invoiceId, item.item_id, item.item_name, item.qty, item.unit_price, item.total, req.shopId]
            );
            await connection.query('UPDATE order_items SET status = "billed" WHERE id = ? AND shop_id = ?', [item.id, req.shopId]);
        }

        await connection.query(
            'UPDATE table_sessions SET status = "credit", closed_at = CURRENT_TIMESTAMP, closed_by = ? WHERE id = ? AND shop_id = ?', 
            [req.user.id, sessionInternalId, req.shopId]
        );
        await connection.query('UPDATE restaurant_tables SET status = "available" WHERE id = ? AND shop_id = ?', [session.table_id, req.shopId]);

        await logAction(req.user.id, 'session_checkout_credit', 'invoice', invoiceId, null, { invoice_no, grandTotal, customer_id: finalCustomerId });

        await connection.commit();
        res.status(201).json({ 
            success: true, 
            message: 'Credit checkout completed', 
            data: { id: invoiceId, uuid: invoiceUuid, invoice_no, grand_total: grandTotal } 
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
            'SELECT * FROM table_sessions WHERE table_id = ? AND status = "open" AND shop_id = ? LIMIT 1',
            [req.params.tableId, req.shopId]
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

        const sessionWhere = buildIdOrUuidWhere('s', sessionId);
        const itemWhere = buildIdOrUuidWhere('oi', itemId);

        const [items] = await connection.query(`SELECT oi.unit_price FROM order_items oi JOIN table_sessions s ON oi.session_id = s.id WHERE ${itemWhere.query} AND ${sessionWhere.query} AND oi.shop_id = ? AND s.shop_id = ?`, [...itemWhere.value, ...sessionWhere.value, req.shopId, req.shopId]);
        if (items.length === 0) throw new Error('Item not found in session');

        const unitPrice = items[0].unit_price;
        const total = unitPrice * qty;

        await connection.query(
            `UPDATE order_items SET qty = ?, total = ?, note = ? WHERE ${itemWhere.query} AND shop_id = ?`,
            [qty, total, note, ...itemWhere.value, req.shopId]
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

// @desc    Transfer Table
// @route   POST /api/table-sessions/:id/transfer
// @access  Private
exports.transferTable = async (req, res) => {
    const sessionId = req.params.id;
    const { target_table_id } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const where = buildIdOrUuidWhere('s', sessionId);
        const [sessions] = await connection.query(`SELECT * FROM table_sessions s WHERE ${where.query} AND status = "open" AND shop_id = ?`, [where.value, req.shopId]);
        const sessionInternalId = session.id;
        
        if (session.table_id == target_table_id) throw new Error('Target table is the same as source table');

        const [tables] = await connection.query('SELECT status FROM restaurant_tables WHERE id = ? AND shop_id = ?', [target_table_id, req.shopId]);
        if (tables.length === 0) throw new Error('Target table not found');
        if (tables[0].status !== 'available') throw new Error('Target table is not available');

        // Update session
        await connection.query('UPDATE table_sessions SET table_id = ? WHERE id = ? AND shop_id = ?', [target_table_id, sessionInternalId, req.shopId]);
        
        // Update table statuses
        await connection.query('UPDATE restaurant_tables SET status = "available" WHERE id = ? AND shop_id = ?', [session.table_id, req.shopId]);
        await connection.query('UPDATE restaurant_tables SET status = "occupied" WHERE id = ? AND shop_id = ?', [target_table_id, req.shopId]);

        await logAction(req.user.id, 'table_transferred', 'table_session', sessionInternalId, null, { from_table: session.table_id, to_table: target_table_id });

        await connection.commit();
        res.json({ success: true, message: 'Table transferred successfully' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Transfer failed' });
    } finally {
        connection.release();
    }
};

// @desc    Merge Table
// @route   POST /api/table-sessions/:id/merge
// @access  Private
exports.mergeTable = async (req, res) => {
    const sourceSessionId = req.params.id;
    const { target_table_id } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const where = buildIdOrUuidWhere('s', sourceSessionId);
        const [sourceSessions] = await connection.query(`SELECT * FROM table_sessions s WHERE ${where.query} AND status = "open"`, [where.value]);
        if (sourceSessions.length === 0) throw new Error('Source session not found or not open');
        const sourceSession = sourceSessions[0];

        const [targetSessions] = await connection.query('SELECT * FROM table_sessions WHERE table_id = ? AND status = "open"', [target_table_id]);
        if (targetSessions.length === 0) throw new Error('Target table does not have an open session. Use transfer instead.');
        const targetSession = targetSessions[0];

        if (sourceSession.id === targetSession.id) throw new Error('Source and target sessions are the same');

        // Move active order_items
        await connection.query('UPDATE order_items SET session_id = ? WHERE session_id = ? AND status != "billed"', [targetSession.id, sourceSession.id]);

        // Move kot_orders
        await connection.query('UPDATE kot_orders SET session_id = ?, table_id = ? WHERE session_id = ?', [targetSession.id, target_table_id, sourceSession.id]);

        // Close source session
        await connection.query('UPDATE table_sessions SET status = "merged", closed_at = CURRENT_TIMESTAMP, closed_by = ? WHERE id = ?', [req.user.id, sourceSession.id]);
        
        // Free source table
        await connection.query('UPDATE restaurant_tables SET status = "available" WHERE id = ?', [sourceSession.table_id]);

        await logAction(req.user.id, 'table_merged', 'table_session', sourceSession.id, null, { merged_into: targetSession.id, source_table: sourceSession.table_id, target_table: target_table_id });

        await connection.commit();
        res.json({ success: true, message: 'Tables merged successfully' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Merge failed' });
    } finally {
        connection.release();
    }
};

// @desc    Cancel table session (Free table)
// @route   DELETE /api/table-sessions/:id
// @access  Private
exports.cancelSession = async (req, res) => {
    const sessionId = req.params.id;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const where = buildIdOrUuidWhere('s', sessionId);
        const [sessions] = await connection.query(`SELECT id, table_id, status FROM table_sessions s WHERE ${where.query} AND s.shop_id = ?`, [where.value, req.shopId]);
        if (sessions.length === 0) throw new Error('Session not found');
        const session = sessions[0];
        
        if (session.status !== 'open') throw new Error('Only open sessions can be cancelled');

        // Check for billed items
        const [billedItems] = await connection.query('SELECT id FROM order_items WHERE session_id = ? AND status = "billed" AND shop_id = ?', [session.id, req.shopId]);
        if (billedItems.length > 0) throw new Error('Cannot cancel session with billed items. Process payment instead.');

        // 1. Close session
        await connection.query('UPDATE table_sessions SET status = "cancelled", closed_at = CURRENT_TIMESTAMP, closed_by = ? WHERE id = ?', [req.user.id, session.id]);

        // 2. Free table
        await connection.query('UPDATE restaurant_tables SET status = "available" WHERE id = ? AND shop_id = ?', [session.table_id, req.shopId]);

        // 3. Cancel active items
        await connection.query('UPDATE order_items SET status = "cancelled" WHERE session_id = ? AND status = "active" AND shop_id = ?', [session.id, req.shopId]);

        await logAction(req.user.id, 'session_cancelled', 'table_session', session.id, null, { table_id: session.table_id });

        await connection.commit();
        res.json({ success: true, message: 'Table session cancelled and table freed' });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    } finally {
        connection.release();
    }
};
