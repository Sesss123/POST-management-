const { db } = require('../config/db');
const { logAction } = require('../utils/logger');
const nayaService = require('../services/nayaAccountService');
const { buildIdOrUuidWhere, generateUuid } = require('../utils/identifier');

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

// Helper to calculate promotion discount
const calculatePromotionDiscount = async (connection, promotion_id, subtotal) => {
    if (!promotion_id) return 0;
    const [promos] = await connection.query('SELECT * FROM promotions WHERE id = ? AND status = "active"', [promotion_id]);
    if (promos.length === 0) return 0;
    
    const promo = promos[0];
    let discount = 0;
    if (promo.type === 'percentage_discount') {
        discount = (subtotal * promo.value) / 100;
    } else if (promo.type === 'fixed_discount') {
        discount = promo.value;
    }
    return discount;
};

// Helper to deduct stock
const deductStock = async (connection, items) => {
    for (const item of items) {
        if (item.is_combo || item.combo_id) {
            const comboId = item.combo_id || item.id;
            const [components] = await connection.query(
                'SELECT item_id, qty FROM combo_items WHERE combo_id = ?',
                [comboId]
            );
            for (const comp of components) {
                await connection.query(
                    'UPDATE items SET stock_qty = stock_qty - ? WHERE id = ? AND track_stock = TRUE',
                    [comp.qty * item.qty, comp.item_id]
                );
                // Auto Sold Out Check
                await connection.query(
                    'UPDATE items SET availability_status = "sold_out" WHERE id = ? AND track_stock = TRUE AND stock_qty <= 0',
                    [comp.item_id]
                );
            }
        } else {
            const itemId = item.item_id || item.id;
            await connection.query(
                'UPDATE items SET stock_qty = stock_qty - ? WHERE id = ? AND track_stock = TRUE',
                [item.qty, itemId]
            );
            // Auto Sold Out Check
            await connection.query(
                'UPDATE items SET availability_status = "sold_out" WHERE id = ? AND track_stock = TRUE AND stock_qty <= 0',
                [itemId]
            );
        }
    }
};

// @desc    Create Cash Sale
// @route   POST /api/invoices/cash-sale
// @access  Private
exports.createCashSale = async (req, res) => {
    const { items, discount_value, discount_type, promotion_id, payment_method, customer_id, order_type = 'takeaway', waiter_id, cash_received } = req.body;
    const connection = await db.getConnection();

    try {
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }
        await connection.beginTransaction();

        const settings = await getSystemSettings(connection);
        const invoice_no = generateInvoiceNo();
        
        let subtotal = 0;
        const processedItems = [];

        // 1. Calculate subtotal from real prices (Rule 7)
        for (const itemInput of items) {
            let realPrice = 0;
            let realName = '';

            if (itemInput.is_combo) {
                const [comboData] = await connection.query('SELECT name, price, status FROM combo_meals WHERE id = ?', [itemInput.id]);
                if (comboData.length === 0) throw new Error(`Combo ID ${itemInput.id} not found`);
                if (comboData[0].status !== 'active') throw new Error(`Combo ${comboData[0].name} is not active`);
                
                realPrice = comboData[0].price;
                realName = comboData[0].name;
                
                // For combos, we also need to check if all components are available
                const [components] = await connection.query(
                    'SELECT i.name, i.availability_status, i.status FROM combo_items ci JOIN items i ON ci.item_id = i.id WHERE ci.combo_id = ?',
                    [itemInput.id]
                );
                for (const comp of components) {
                    if (comp.status !== 'active') throw new Error(`Component ${comp.name} is inactive`);
                    if (comp.availability_status !== 'available') throw new Error(`Component ${comp.name} is ${comp.availability_status.replace('_', ' ')}`);
                }
            } else {
                const [itemData] = await connection.query('SELECT name, price, status, availability_status, no_receipt_default FROM items WHERE id = ?', [itemInput.id]);
                if (itemData.length === 0) throw new Error(`Item ID ${itemInput.id} not found`);
                if (itemData[0].status !== 'active') throw new Error(`Item ${itemData[0].name} is inactive`);
                if (itemData[0].availability_status !== 'available') {
                    throw new Error(`Item ${itemData[0].name} is ${itemData[0].availability_status.replace('_', ' ')}`);
                }
                
                realPrice = itemData[0].price;
                realName = itemData[0].name;
            }

            let modifierTotal = 0;
            const itemModifiers = [];

            if (itemInput.modifiers && itemInput.modifiers.length > 0) {
                const modifierIds = itemInput.modifiers.map(m => m.modifier_id || m.id);
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

            const itemUnitPrice = realPrice + modifierTotal;
            const itemTotal = itemUnitPrice * itemInput.qty;
            subtotal += itemTotal;

            processedItems.push({
                item_id: itemInput.id,
                item_name: realName,
                qty: itemInput.qty,
                unit_price: realPrice,
                modifier_total: modifierTotal,
                total: itemTotal,
                item_type: itemInput.is_combo ? 'combo' : 'item',
                combo_id: itemInput.is_combo ? itemInput.id : null,
                special_note: itemInput.special_note || null,
                modifiers: itemModifiers,
                no_receipt_item: !itemInput.is_combo ? (itemData[0].no_receipt_default || false) : false
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
        const promotion_discount_amount = await calculatePromotionDiscount(connection, promotion_id, discountedSubtotal);
        const finalSubtotal = Math.max(0, discountedSubtotal - promotion_discount_amount);

        // 2.1 Check Discount Approval Limit
        const discountLimit = parseFloat(settings.discount_approval_limit || 0);
        if (discount_amount > discountLimit && req.user.role !== 'admin') {
            throw new Error(`Discount exceeds approval limit (Max: ${settings.currency_symbol || 'Rs.'} ${discountLimit}). Manager override required.`);
        }

        // 3. Calculate Tax and Service Charge
        const taxEnabled = settings.tax_enabled === 'true';
        const scEnabled = settings.service_charge_enabled === 'true';
        const taxRate = taxEnabled ? parseFloat(settings.tax_rate || 0) : 0;
        const scRate = scEnabled ? parseFloat(settings.service_charge_rate || 0) : 0;
        
        const taxAmount = (finalSubtotal * taxRate) / 100;
        const scAmount = (finalSubtotal * scRate) / 100;
        const grand_total = finalSubtotal + taxAmount + scAmount;

        let finalWaiterId = waiter_id || null;
        if (!finalWaiterId && req.user.role === 'waiter') {
            finalWaiterId = req.user.id;
        }

        // 3.1 Validate Cash Received
        let finalCashReceived = parseFloat(cash_received || 0);
        let changeAmount = 0;

        if (payment_method === 'cash') {
            if (finalCashReceived < grand_total) {
                throw new Error(`Cash received (${finalCashReceived}) is not enough for total ${grand_total}`);
            }
            changeAmount = finalCashReceived - grand_total;
        } else {
            // For non-cash, we assume exact payment
            finalCashReceived = grand_total;
            changeAmount = 0;
        }

        // 4. Insert Invoice
        const invoiceUuid = generateUuid();
        const [invoiceResult] = await connection.query(
            `INSERT INTO invoices (
                uuid, invoice_no, customer_id, invoice_type, order_type, waiter_id, payment_status, 
                payment_method, subtotal, discount_type, discount_value, discount, 
                promotion_id, promotion_discount_amount,
                tax_rate, tax_amount, service_charge_rate, service_charge_amount,
                grand_total, paid_amount, cash_received, change_amount, balance_amount, created_by,
                sale_channel, no_receipt, sale_type
            ) VALUES (?, ?, ?, 'cash_sale', ?, ?, 'paid', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'normal', false, 'restaurant')`,
            [
                invoiceUuid, invoice_no, customer_id || null, order_type, finalWaiterId, payment_method || 'cash',
                subtotal, discount_type || 'fixed', discount_value || 0, discount_amount,
                promotion_id || null, promotion_discount_amount,
                taxRate, taxAmount, scRate, scAmount,
                grand_total, grand_total, finalCashReceived, changeAmount, req.user.id
            ]
        );

        const invoiceId = invoiceResult.insertId;

        // 5. Insert Items
        for (const item of processedItems) {
            const itemUuid = generateUuid();
            const [itemResult] = await connection.query(
                `INSERT INTO invoice_items (uuid, invoice_id, item_id, item_name, qty, unit_price, modifier_total, total, special_note, no_receipt_item)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [itemUuid, invoiceId, item.item_id, item.item_name, item.qty, item.unit_price, item.modifier_total, item.total, item.special_note, item.no_receipt_item ? 1 : 0]
            );
            const invoiceItemId = itemResult.insertId;

            // Insert Modifiers
            if (item.modifiers && item.modifiers.length > 0) {
                for (const mod of item.modifiers) {
                    const modUuid = generateUuid();
                    await connection.query(
                        `INSERT INTO invoice_item_modifiers (uuid, invoice_item_id, modifier_id, modifier_name, modifier_type, price_delta)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [modUuid, invoiceItemId, mod.modifier_id, mod.name, mod.type, mod.price_delta]
                    );
                }
            }
        }

        // 5.1 Record Promotion Usage
        if (promotion_id && promotion_discount_amount > 0) {
            await connection.query(
                'INSERT INTO promotion_usage (promotion_id, invoice_id, discount_amount) VALUES (?, ?, ?)',
                [promotion_id, invoiceId, promotion_discount_amount]
            );
        }

        // 5.2 Deduct Stock
        await deductStock(connection, processedItems);

        // 6. Log Action
        await logAction(req.user.id, 'cash_sale_created', 'invoice', invoiceId, null, { invoice_no, grand_total });

        // 7. Get Full Invoice Details for Frontend (Important for Printing)
        const [fullInvoices] = await connection.query(
            `SELECT i.*, c.name as customer_name, u.name as created_by_name
             FROM invoices i
             LEFT JOIN customers c ON i.customer_id = c.id
             LEFT JOIN users u ON i.created_by = u.id
             WHERE i.id = ?`,
            [invoiceId]
        );
        const fullInvoice = fullInvoices[0];
        const [invoiceItems] = await connection.query('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId]);
        fullInvoice.items = invoiceItems;

        // Get settings too
        const [settingsRows] = await connection.query('SELECT * FROM settings');
        fullInvoice.settings = settingsRows.reduce((acc, s) => {
            acc[s.setting_key] = s.setting_value;
            return acc;
        }, {});

        await connection.commit();
        res.status(201).json({ 
            success: true, 
            message: 'Cash sale completed', 
            data: fullInvoice
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
    const { session_id, payment_method, discount_value, discount_type, promotion_id, customer_id, cash_received } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const settings = await getSystemSettings(connection);
        const invoice_no = generateInvoiceNo();

        // 1. Get Session and Table
        const where = buildIdOrUuidWhere('s', session_id);
        const [sessions] = await connection.query(`SELECT * FROM table_sessions s WHERE ${where.query} AND status = "open"`, [where.value]);
        if (sessions.length === 0) throw new Error('Active session not found');
        const session = sessions[0];
        const sessionInternalId = session.id;

        // 2. Get Order Items
        const [orderItems] = await connection.query('SELECT * FROM order_items WHERE session_id = ? AND status = "active"', [sessionInternalId]);
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
        const promotion_discount_amount = await calculatePromotionDiscount(connection, promotion_id, discountedSubtotal);
        const finalSubtotal = Math.max(0, discountedSubtotal - promotion_discount_amount);

        // 3.1 Check Discount Approval Limit
        const discountLimit = parseFloat(settings.discount_approval_limit || 0);
        if (discount_amount > discountLimit && req.user.role !== 'admin') {
            throw new Error(`Discount exceeds approval limit (Max: ${settings.currency_symbol || 'Rs.'} ${discountLimit}). Manager override required.`);
        }
        const taxEnabled = settings.tax_enabled === 'true';
        const scEnabled = settings.service_charge_enabled === 'true';
        const taxRate = taxEnabled ? parseFloat(settings.tax_rate || 0) : 0;
        const scRate = scEnabled ? parseFloat(settings.service_charge_rate || 0) : 0;
        const taxAmount = (finalSubtotal * taxRate) / 100;
        const scAmount = (finalSubtotal * scRate) / 100;
        const grand_total = finalSubtotal + taxAmount + scAmount;

        const isCredit = payment_method === 'credit';
        const final_customer_id = customer_id || session.customer_id;

        if (isCredit && !final_customer_id) throw new Error('Customer required for credit sale');

        // 3.2 Validate Cash Received
        let finalCashReceived = parseFloat(cash_received || 0);
        let changeAmount = 0;

        if (payment_method === 'cash') {
            if (finalCashReceived < grand_total) {
                throw new Error(`Cash received (${finalCashReceived}) is not enough for total ${grand_total}`);
            }
            changeAmount = finalCashReceived - grand_total;
        } else if (payment_method === 'credit') {
            finalCashReceived = 0;
            changeAmount = 0;
        } else {
            finalCashReceived = grand_total;
            changeAmount = 0;
        }

        if (isCredit) {
            await nayaService.validateCreditLimit(connection, {
                customerId: final_customer_id,
                amount: grand_total
            });
        }

        // 4. Create Invoice
        const invoiceUuid = generateUuid();
        const [invoiceResult] = await connection.query(
            `INSERT INTO invoices (
                uuid, invoice_no, customer_id, table_id, session_id, invoice_type, 
                payment_status, payment_method, subtotal, discount_type, discount_value, discount, 
                promotion_id, promotion_discount_amount,
                tax_rate, tax_amount, service_charge_rate, service_charge_amount,
                grand_total, paid_amount, cash_received, change_amount, balance_amount, created_by, sale_type
            ) VALUES (?, ?, ?, ?, ?, ?, 'table_sale', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'restaurant')`,
            [
                invoiceUuid, invoice_no, final_customer_id, session.table_id, sessionInternalId,
                isCredit ? 'unpaid' : 'paid', payment_method,
                subtotal, discount_type || 'fixed', discount_value || 0, discount_amount,
                promotion_id || null, promotion_discount_amount,
                taxRate, taxAmount, scRate, scAmount,
                grand_total, isCredit ? 0 : grand_total, isCredit ? 0 : finalCashReceived, isCredit ? 0 : changeAmount, isCredit ? grand_total : 0, req.user.id
            ]
        );
        const invoiceId = invoiceResult.insertId;

        // 5. Insert Items and mark as served/completed
        for (const item of orderItems) {
            const itemUuid = generateUuid();
            const [invoiceItemResult] = await connection.query(
                `INSERT INTO invoice_items (uuid, invoice_id, item_id, item_name, qty, unit_price, modifier_total, total, special_note)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [itemUuid, invoiceId, item.item_id, item.item_name, item.qty, item.unit_price, item.modifier_total, item.total, item.special_note]
            );
            const invoiceItemId = invoiceItemResult.insertId;

            // Copy modifiers
            const [mods] = await connection.query('SELECT * FROM order_item_modifiers WHERE order_item_id = ?', [item.id]);
            for (const mod of mods) {
                const modUuid = generateUuid();
                await connection.query(
                    `INSERT INTO invoice_item_modifiers (uuid, invoice_item_id, modifier_id, modifier_name, modifier_type, price_delta)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [modUuid, invoiceItemId, mod.modifier_id, mod.modifier_name, mod.modifier_type, mod.price_delta]
                );
            }
        }

        // 5.1 Record Promotion Usage
        if (promotion_id && promotion_discount_amount > 0) {
            await connection.query(
                'INSERT INTO promotion_usage (promotion_id, invoice_id, discount_amount) VALUES (?, ?, ?)',
                [promotion_id, invoiceId, promotion_discount_amount]
            );
        }

        // 5.2 Deduct Stock
        await deductStock(connection, orderItems);

        // 6. Naya Integration
        if (isCredit) {
            const nayaResult = await nayaService.createCreditInvoiceForCustomer(connection, {
                customerId: final_customer_id,
                invoiceId: invoiceId,
                amount: grand_total,
                description: `Table sale credit - Inv: ${invoice_no}`
            });
        }

        // 7. Close Session and Table
        await connection.query('UPDATE table_sessions SET status = ?, closed_at = CURRENT_TIMESTAMP, closed_by = ? WHERE id = ?', [isCredit ? 'credit' : 'paid', req.user.id, sessionInternalId]);
        await connection.query('UPDATE restaurant_tables SET status = "available" WHERE id = ?', [session.table_id]);

        await logAction(req.user.id, 'invoice_created', 'invoice', invoiceId, null, { invoice_no, grand_total, method: payment_method });

        // 8. Get Full Invoice Details for Frontend
        const [fullInvoices] = await connection.query(
            `SELECT i.*, c.name as customer_name, t.table_no, u.name as created_by_name
             FROM invoices i
             LEFT JOIN customers c ON i.customer_id = c.id
             LEFT JOIN restaurant_tables t ON i.table_id = t.id
             LEFT JOIN users u ON i.created_by = u.id
             WHERE i.id = ?`,
            [invoiceId]
        );
        const fullInvoice = fullInvoices[0];
        const [invoiceItems] = await connection.query('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId]);
        fullInvoice.items = invoiceItems;

        const [settingsRows] = await connection.query('SELECT * FROM settings');
        fullInvoice.settings = settingsRows.reduce((acc, s) => {
            acc[s.setting_key] = s.setting_value;
            return acc;
        }, {});

        await connection.commit();
        res.status(201).json({ success: true, message: 'Checkout completed', data: fullInvoice });

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
        const where = buildIdOrUuidWhere('i', req.params.id);
        const [invoices] = await db.query(
            `SELECT i.*, c.name as customer_name, c.phone as customer_phone, t.table_no, u.name as created_by_name
             FROM invoices i
             LEFT JOIN customers c ON i.customer_id = c.id
             LEFT JOIN restaurant_tables t ON i.table_id = t.id
             LEFT JOIN users u ON i.created_by = u.id
             WHERE ${where.query}`,
            [where.value]
        );
        
        if (invoices.length === 0) return res.status(404).json({ success: false, message: 'Invoice not found' });
        const invoice = invoices[0];
        const invoiceId = invoice.id;
        
        const [items] = await db.query('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId]);
        
        for (let item of items) {
            const [itemMods] = await db.query(
                'SELECT modifier_name as name, modifier_type as type, price_delta FROM invoice_item_modifiers WHERE invoice_item_id = ?',
                [item.id]
            );
            item.modifiers = itemMods;
        }

        
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

        const where = buildIdOrUuidWhere(null, req.params.id);
        const [invoices] = await connection.query(`SELECT * FROM invoices WHERE ${where.query}`, [where.value]);
        if (invoices.length === 0) throw new Error('Invoice not found');
        
        const invoice = invoices[0];
        const invoiceId = invoice.id;

        if (invoice.payment_status === 'cancelled') throw new Error('Invoice already cancelled');

        await connection.query(
            'UPDATE invoices SET payment_status = "cancelled", cancel_reason = ? WHERE id = ?',
            [reason, invoiceId]
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
    const { session_id, order_item_ids, payment_method, discount_value, discount_type, promotion_id, customer_id } = req.body;
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
        const promotion_discount_amount = await calculatePromotionDiscount(connection, promotion_id, discountedSubtotal);
        const finalSubtotal = Math.max(0, discountedSubtotal - promotion_discount_amount);

        // 3.1 Check Discount Approval Limit
        const discountLimit = parseFloat(settings.discount_approval_limit || 0);
        if (discount_amount > discountLimit && req.user.role !== 'admin') {
            throw new Error(`Discount exceeds approval limit (Max: ${settings.currency_symbol || 'Rs.'} ${discountLimit}). Manager override required.`);
        }
        const taxEnabled = settings.tax_enabled === 'true';
        const scEnabled = settings.service_charge_enabled === 'true';
        const taxRate = taxEnabled ? parseFloat(settings.tax_rate || 0) : 0;
        const scRate = scEnabled ? parseFloat(settings.service_charge_rate || 0) : 0;
        const taxAmount = (finalSubtotal * taxRate) / 100;
        const scAmount = (finalSubtotal * scRate) / 100;
        const grand_total = finalSubtotal + taxAmount + scAmount;

        const isCredit = payment_method === 'credit';
        const final_customer_id = customer_id || session.customer_id;

        if (isCredit && !final_customer_id) throw new Error('Customer required for credit sale');
        
        if (isCredit) {
            await nayaService.validateCreditLimit(connection, {
                customerId: final_customer_id,
                amount: grand_total
            });
        }

        // 4. Create Invoice
        const invoiceUuid = generateUuid();
        const [invoiceResult] = await connection.query(
            `INSERT INTO invoices (
                uuid, invoice_no, customer_id, table_id, session_id, invoice_type, 
                payment_status, payment_method, subtotal, discount_type, discount_value, discount, 
                promotion_id, promotion_discount_amount,
                tax_rate, tax_amount, service_charge_rate, service_charge_amount,
                grand_total, paid_amount, balance_amount, created_by
            ) VALUES (?, ?, ?, ?, ?, 'table_sale', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                invoiceUuid, invoice_no, final_customer_id, session.table_id, session_id,
                isCredit ? 'unpaid' : 'paid', payment_method,
                subtotal, discount_type || 'fixed', discount_value || 0, discount_amount,
                promotion_id || null, promotion_discount_amount,
                taxRate, taxAmount, scRate, scAmount,
                grand_total, isCredit ? 0 : grand_total, isCredit ? grand_total : 0, req.user.id
            ]
        );
        const invoiceId = invoiceResult.insertId;

        // 5. Insert Items and mark as billed
        for (const item of orderItems) {
            const [invoiceItemResult] = await connection.query(
                `INSERT INTO invoice_items (invoice_id, item_id, item_name, qty, unit_price, modifier_total, total, special_note)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [invoiceId, item.item_id, item.item_name, item.qty, item.unit_price, item.modifier_total, item.total, item.special_note]
            );
            const invoiceItemId = invoiceItemResult.insertId;

            // Copy modifiers
            await connection.query(
                `INSERT INTO invoice_item_modifiers (invoice_item_id, modifier_id, modifier_name, modifier_type, price_delta)
                 SELECT ?, modifier_id, modifier_name, modifier_type, price_delta
                 FROM order_item_modifiers WHERE order_item_id = ?`,
                [invoiceItemId, item.id]
            );

            await connection.query('UPDATE order_items SET status = "billed" WHERE id = ?', [item.id]);
        }

        // 5.1 Record Promotion Usage
        if (promotion_id && promotion_discount_amount > 0) {
            await connection.query(
                'INSERT INTO promotion_usage (promotion_id, invoice_id, discount_amount) VALUES (?, ?, ?)',
                [promotion_id, invoiceId, promotion_discount_amount]
            );
        }

        // 5.2 Deduct Stock
        await deductStock(connection, orderItems);

        // 6. Naya Integration
        if (isCredit) {
            await nayaService.createCreditInvoiceForCustomer(connection, {
                customerId: final_customer_id,
                invoiceId: invoiceId,
                amount: grand_total,
                description: `Split bill credit - Inv: ${invoice_no}`
            });
        }

        // 7. Check if session should be closed (if no active items left)
        const [remainingItems] = await connection.query('SELECT id FROM order_items WHERE session_id = ? AND status IN ("active", "served")', [session_id]);
        if (remainingItems.length === 0) {
            await connection.query('UPDATE table_sessions SET status = "paid", closed_at = CURRENT_TIMESTAMP, closed_by = ? WHERE id = ?', [req.user.id, session_id]);
            await connection.query('UPDATE restaurant_tables SET status = "available" WHERE id = ?', [session.table_id]);
        }

        await logAction(req.user.id, 'split_invoice_created', 'invoice', invoiceId, null, { invoice_no, grand_total, method: payment_method });

        await connection.commit();
        res.status(201).json({ success: true, message: 'Split bill completed', data: { id: invoiceId, uuid: invoiceUuid, invoice_no, grand_total } });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Split bill failed' });
    } finally {
        connection.release();
    }
};

// @desc    Void an invoice immediately (undo) and return items
// @route   DELETE /api/invoices/:id/void
// @access  Private
// @desc    Create Cash Sale with Credit (Add to Naya)
// @route   POST /api/invoices/cash-sale/add-to-credit
// @access  Private
exports.createCashSaleCredit = async (req, res) => {
    const { items, discount_value, discount_type, promotion_id, customer_id, order_type = 'takeaway', waiter_id } = req.body;
    const connection = await db.getConnection();

    try {
        if (!customer_id) {
            return res.status(400).json({ success: false, message: 'Customer selection is required for credit sales' });
        }
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }
        await connection.beginTransaction();

        const settings = await getSystemSettings(connection);
        const invoice_no = generateInvoiceNo();
        
        let subtotal = 0;
        const processedItems = [];

        // 1. Calculate totals from database
        for (const itemInput of items) {
            let realPrice = 0;
            let realName = '';

            if (itemInput.is_combo) {
                const [comboData] = await connection.query('SELECT name, price, status FROM combo_meals WHERE id = ?', [itemInput.id]);
                if (comboData.length === 0) throw new Error(`Combo ID ${itemInput.id} not found`);
                if (comboData[0].status !== 'active') throw new Error(`Combo ${comboData[0].name} is not active`);
                realPrice = comboData[0].price;
                realName = comboData[0].name;
            } else {
                const [itemData] = await connection.query('SELECT name, price, availability_status, status FROM items WHERE id = ?', [itemInput.id]);
                if (itemData.length === 0) throw new Error(`Item ID ${itemInput.id} not found`);
                if (itemData[0].status !== 'active') throw new Error(`Item ${itemData[0].name} is not active`);
                if (itemData[0].availability_status === 'sold_out') throw new Error(`Item ${itemData[0].name} is sold out`);
                realPrice = itemData[0].price;
                realName = itemData[0].name;
            }
            
            const itemTotal = realPrice * itemInput.qty;
            subtotal += itemTotal;
            processedItems.push({
                item_id: itemInput.id,
                item_name: realName,
                qty: itemInput.qty,
                unit_price: realPrice,
                total: itemTotal,
                is_combo: itemInput.is_combo
            });
        }

        // 2. Discounts & Promos
        let promotion_discount_amount = 0;
        if (promotion_id) {
            promotion_discount_amount = await calculatePromotionDiscount(connection, promotion_id, subtotal);
        }

        let discount_amount = 0;
        const prePromoSubtotal = subtotal - promotion_discount_amount;
        
        if (discount_type === 'percentage') {
            discount_amount = (prePromoSubtotal * (parseFloat(discount_value) || 0)) / 100;
        } else {
            discount_amount = parseFloat(discount_value) || 0;
        }

        const finalSubtotal = prePromoSubtotal - discount_amount;

        // Discount approval check
        const discountLimit = parseFloat(settings.discount_approval_limit || 0);
        if (discount_amount > discountLimit && req.user.role !== 'admin') {
            throw new Error(`Discount exceeds approval limit (Max: ${settings.currency_symbol || 'Rs.'} ${discountLimit}). Manager override required.`);
        }

        // 3. Tax & Service Charge
        const taxEnabled = settings.tax_enabled === 'true';
        const scEnabled = settings.service_charge_enabled === 'true';
        const taxRate = taxEnabled ? parseFloat(settings.tax_rate || 0) : 0;
        const scRate = scEnabled ? parseFloat(settings.service_charge_rate || 0) : 0;
        
        const taxAmount = (finalSubtotal * taxRate) / 100;
        const scAmount = (finalSubtotal * scRate) / 100;
        const grand_total = finalSubtotal + taxAmount + scAmount;

        let finalWaiterId = waiter_id || null;
        if (!finalWaiterId && req.user.role === 'waiter') finalWaiterId = req.user.id;

        // 3.2 Validate credit limit before proceeding
        await nayaService.validateCreditLimit(connection, {
            customerId: customer_id,
            amount: grand_total
        });

        // 4. Create Invoice (unpaid/credit)
        const invoiceUuid = generateUuid();
        const [invoiceResult] = await connection.query(
            `INSERT INTO invoices (
                uuid, invoice_no, customer_id, invoice_type, order_type, waiter_id, payment_status, 
                payment_method, subtotal, discount_type, discount_value, discount, 
                promotion_id, promotion_discount_amount,
                tax_rate, tax_amount, service_charge_rate, service_charge_amount,
                grand_total, paid_amount, balance_amount, created_by
            ) VALUES (?, ?, ?, 'credit_sale', ?, ?, 'unpaid', 'credit', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
            [
                invoiceUuid, invoice_no, customer_id, order_type, finalWaiterId,
                subtotal, discount_type || 'fixed', discount_value || 0, discount_amount,
                promotion_id || null, promotion_discount_amount,
                taxRate, taxAmount, scRate, scAmount,
                grand_total, grand_total, req.user.id
            ]
        );
        const invoiceId = invoiceResult.insertId;

        // 5. Invoice Items
        for (const item of processedItems) {
            const itemUuid = generateUuid();
            await connection.query(
                `INSERT INTO invoice_items (uuid, invoice_id, item_id, item_name, qty, unit_price, total)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [itemUuid, invoiceId, item.item_id, item.item_name, item.qty, item.unit_price, item.total]
            );
        }

        // 6. Naya Integration
        const nayaResult = await nayaService.createCreditInvoiceForCustomer(connection, {
            customerId: customer_id,
            invoiceId: invoiceId,
            amount: grand_total,
            description: `Cash sale (Credit) - Inv: ${invoice_no}`
        });

        // 7. Stock & Promotion usage
        if (promotion_id && promotion_discount_amount > 0) {
            await connection.query(
                'INSERT INTO promotion_usage (promotion_id, invoice_id, discount_amount) VALUES (?, ?, ?)',
                [promotion_id, invoiceId, promotion_discount_amount]
            );
        }
        await deductStock(connection, processedItems);

        await logAction(req.user.id, 'credit_sale_created', 'invoice', invoiceId, null, { invoice_no, grand_total, customer_id });

        // 8. Prepare response
        const [fullInvoices] = await connection.query(
            `SELECT i.*, c.name as customer_name, u.name as created_by_name
             FROM invoices i
             LEFT JOIN customers c ON i.customer_id = c.id
             LEFT JOIN users u ON i.created_by = u.id
             WHERE i.id = ?`,
            [invoiceId]
        );
        const fullInvoice = fullInvoices[0];
        const [invoiceItems] = await connection.query('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId]);
        fullInvoice.items = invoiceItems;
        fullInvoice.new_customer_balance = nayaResult.newBalance;

        await connection.commit();
        res.status(201).json({ success: true, message: 'Credit sale recorded in Naya Book', data: fullInvoice });

    } catch (error) {
        await connection.rollback();
        console.error('Credit Sale Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Credit sale failed' });
    } finally {
        connection.release();
    }
};

exports.voidInvoice = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [invoice] = await connection.query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
        if (invoice.length === 0) throw new Error('Invoice not found');

        // Only allow voiding within 15 minutes of creation
        const createdAt = new Date(invoice[0].created_at);
        const now = new Date();
        const diff = (now - createdAt) / 1000 / 60;
        if (diff > 15) throw new Error('Cannot void invoice after 15 minutes. Use "Cancel" instead.');

        // 1. Get items to restore stock
        const [items] = await connection.query('SELECT * FROM invoice_items WHERE invoice_id = ?', [req.params.id]);

        // 2. Restore Stock
        for (const item of items) {
            if (item.item_type === 'item') {
                await connection.query('UPDATE items SET stock_qty = stock_qty + ? WHERE id = ? AND track_stock = TRUE', [item.qty, item.item_id]);
                // Re-enable availability if stock > 0
                await connection.query('UPDATE items SET availability_status = "available" WHERE id = ? AND track_stock = TRUE AND stock_qty > 0', [item.item_id]);
            } else if (item.item_type === 'combo') {
                const [comboItems] = await connection.query('SELECT item_id, qty FROM combo_items WHERE combo_id = ?', [item.item_id]);
                for (const ci of comboItems) {
                    await connection.query('UPDATE items SET stock_qty = stock_qty + ? WHERE id = ? AND track_stock = TRUE', [ci.qty * item.qty, ci.item_id]);
                    await connection.query('UPDATE items SET availability_status = "available" WHERE id = ? AND track_stock = TRUE AND stock_qty > 0', [ci.item_id]);
                }
            }
        }

        // 3. Delete promotion usage if any
        await connection.query('DELETE FROM promotion_usage WHERE invoice_id = ?', [req.params.id]);

        // 4. Delete invoice items and invoice
        await connection.query('DELETE FROM invoice_items WHERE invoice_id = ?', [req.params.id]);
        await connection.query('DELETE FROM invoices WHERE id = ?', [req.params.id]);

        await logAction(req.user.id, 'invoice_voided', 'invoice', req.params.id, invoice[0], null);

        await connection.commit();
        res.json({ 
            success: true, 
            message: 'Invoice voided and items restored',
            data: {
                items: items.map(i => ({
                    id: i.item_id,
                    name: i.item_name,
                    price: i.unit_price,
                    qty: i.qty,
                    is_combo: i.item_type === 'combo'
                })),
                discount: invoice[0].discount_value,
                discount_type: invoice[0].discount_type,
                promotion_id: invoice[0].promotion_id
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

// @desc    Create Quick Cash Sale (No Receipt)
// @route   POST /api/invoices/quick-sale
// @access  Private
exports.createQuickSale = async (req, res) => {
    const { items, cash_received, note } = req.body;
    const connection = await db.getConnection();

    try {
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }
        await connection.beginTransaction();

        const settings = await getSystemSettings(connection);
        const invoice_no = generateInvoiceNo();
        
        let subtotal = 0;
        const processedItems = [];

        // 1. Calculate subtotal from real prices
        for (const itemInput of items) {
            const [itemData] = await connection.query('SELECT name, price, status, availability_status, requires_age_confirmation, no_receipt_default FROM items WHERE id = ?', [itemInput.item_id || itemInput.id]);
            if (itemData.length === 0) throw new Error(`Item ID ${itemInput.item_id || itemInput.id} not found`);
            if (itemData[0].status !== 'active') throw new Error(`Item ${itemData[0].name} is inactive`);
            if (itemData[0].availability_status !== 'available') {
                throw new Error(`Item ${itemData[0].name} is ${itemData[0].availability_status.replace('_', ' ')}`);
            }
            
            if (itemData[0].requires_age_confirmation && !itemInput.age_confirmed) {
                throw new Error(`Age confirmation required for ${itemData[0].name}`);
            }

            const realPrice = itemData[0].price;
            const itemTotal = realPrice * itemInput.qty;
            subtotal += itemTotal;

            processedItems.push({
                item_id: itemInput.item_id || itemInput.id,
                item_name: itemData[0].name,
                qty: itemInput.qty,
                unit_price: realPrice,
                modifier_total: 0,
                total: itemTotal,
                item_type: 'item',
                combo_id: null,
                special_note: itemInput.special_note || note || null,
                age_confirmed: itemInput.age_confirmed || false,
                no_receipt_item: itemData[0].no_receipt_default || false
            });
        }

        // 3. Calculate Tax and Service Charge
        const taxEnabled = settings.tax_enabled === 'true';
        const scEnabled = settings.service_charge_enabled === 'true';
        const taxRate = taxEnabled ? parseFloat(settings.tax_rate || 0) : 0;
        const scRate = scEnabled ? parseFloat(settings.service_charge_rate || 0) : 0;
        
        const taxAmount = (subtotal * taxRate) / 100;
        const scAmount = (subtotal * scRate) / 100;
        const grand_total = subtotal + taxAmount + scAmount;

        let finalCashReceived = parseFloat(cash_received || 0);
        let changeAmount = 0;

        if (finalCashReceived < grand_total) {
            throw new Error(`Cash received (${finalCashReceived}) is not enough for total ${grand_total}`);
        }
        changeAmount = finalCashReceived - grand_total;

        // 4. Insert Invoice
        const [invoiceResult] = await connection.query(
            `INSERT INTO invoices (
                invoice_no, invoice_type, payment_status, payment_method, subtotal, 
                tax_rate, tax_amount, service_charge_rate, service_charge_amount,
                grand_total, paid_amount, cash_received, change_amount, balance_amount, created_by,
                sale_channel, no_receipt, receipt_printed
            ) VALUES (?, 'cash_sale', 'paid', 'cash', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'quick_no_receipt', true, false)`,
            [
                invoice_no, subtotal, taxRate, taxAmount, scRate, scAmount,
                grand_total, grand_total, finalCashReceived, changeAmount, req.user.id
            ]
        );

        const invoiceId = invoiceResult.insertId;

        let hasRestrictedItem = false;

        // 5. Insert Items
        for (const item of processedItems) {
            const [itemResult] = await connection.query(
                `INSERT INTO invoice_items (invoice_id, item_id, item_name, qty, unit_price, modifier_total, total, special_note, age_confirmed, no_receipt_item)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [invoiceId, item.item_id, item.item_name, item.qty, item.unit_price, item.modifier_total, item.total, item.special_note, item.age_confirmed, item.no_receipt_item ? 1 : 0]
            );
            if (item.age_confirmed) hasRestrictedItem = true;
        }

        // 5.2 Deduct Stock
        await deductStock(connection, processedItems);

        // 6. Log Action
        await logAction(req.user.id, 'quick_sale_created', 'invoice', invoiceId, null, { invoice_no, grand_total });
        if (hasRestrictedItem) {
            await logAction(req.user.id, 'restricted_item_sold', 'invoice', invoiceId, null, { invoice_no });
        }

        await connection.commit();
        res.status(201).json({ 
            success: true, 
            message: 'Quick sale saved', 
            data: {
                invoice_id: invoiceId,
                invoice_no: invoice_no,
                grand_total: grand_total,
                cash_received: finalCashReceived,
                change_amount: changeAmount,
                no_receipt: true
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Failed to process quick sale' });
    } finally {
        connection.release();
    }
};

// @desc    Create quick retail / no-receipt sale
// @route   POST /api/invoices/quick-retail-sale
// @access  Private
exports.createQuickRetailSale = async (req, res) => {
    const { items, cash_received } = req.body;
    
    if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart cannot be empty' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [settingsRows] = await connection.query('SELECT setting_key, setting_value FROM settings');
        const settings = {};
        settingsRows.forEach(row => settings[row.setting_key] = row.setting_value);

        if (settings.quick_retail_enabled === 'false') {
             throw new Error('Quick Retail is currently disabled in system settings.');
        }

        const invoice_no = await generateInvoiceNo(connection);
        let subtotal = 0;
        const processedItems = [];

        for (const itemInput of items) {
            const [itemData] = await connection.query(
                'SELECT id, name, price, status, availability_status, item_type, age_restricted, requires_age_confirmation, track_stock, stock_qty, no_receipt_default, send_to_kitchen FROM items WHERE id = ?', 
                [itemInput.item_id]
            );
            
            if (itemData.length === 0) throw new Error(`Item ID ${itemInput.item_id} not found`);
            const item = itemData[0];

            if (item.status !== 'active' || item.availability_status !== 'available') {
                throw new Error(`Item ${item.name} is not available`);
            }

            // Age Confirmation Check
            if (item.requires_age_confirmation && !itemInput.age_confirmed) {
                throw new Error(`Age confirmation required for ${item.name}.`);
            }

            // Stock Check
            if (item.track_stock && item.stock_qty < itemInput.qty) {
                throw new Error(`Insufficient stock for ${item.name}. Available: ${item.stock_qty}`);
            }

            const itemTotal = item.price * itemInput.qty;
            subtotal += itemTotal;

            processedItems.push({
                ...item,
                qty: itemInput.qty,
                total: itemTotal,
                age_confirmed: itemInput.age_confirmed ? 1 : 0
            });
        }

        const grand_total = subtotal; 
        
        const finalCashReceived = parseFloat(cash_received || 0);
        if (finalCashReceived < grand_total) {
            throw new Error(`Cash received (${finalCashReceived}) is not enough for total ${grand_total}`);
        }
        const changeAmount = finalCashReceived - grand_total;

        // Create Invoice
        const [invoiceResult] = await connection.query(
            `INSERT INTO invoices (
                invoice_no, invoice_type, payment_status, payment_method, 
                subtotal, grand_total, paid_amount, cash_received, change_amount, 
                balance_amount, created_by, sale_channel, no_receipt, receipt_printed, sale_type
            ) VALUES (?, 'cash_sale', 'paid', 'cash', ?, ?, ?, ?, ?, 0, ?, 'quick_no_receipt', true, false, 'quick')`,
            [invoice_no, subtotal, grand_total, grand_total, finalCashReceived, changeAmount, req.user.id]
        );

        const invoiceId = invoiceResult.insertId;

        // Insert Items and Update Stock
        for (const item of processedItems) {
            await connection.query(
                `INSERT INTO invoice_items (
                    invoice_id, item_id, item_name, qty, unit_price, total, 
                    no_receipt_item, item_type, age_restricted, age_confirmed, send_to_kitchen
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    invoiceId, item.id, item.name, item.qty, item.price, item.total, 
                    1, item.item_type, item.age_restricted, item.age_confirmed, 0 
                ]
            );

            if (item.track_stock) {
                await connection.query('UPDATE items SET stock_qty = stock_qty - ? WHERE id = ?', [item.qty, item.id]);
            }
        }

        await connection.commit();
        await logAction(req.user.id, 'quick_retail_sale_created', 'invoice', invoiceId, null, { items: processedItems, total: grand_total });

        res.json({ 
            success: true, 
            message: 'Quick retail sale successful', 
            data: { 
                invoice_no, 
                total: grand_total, 
                cash_received: finalCashReceived, 
                change_amount: changeAmount 
            } 
        });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    } finally {
        connection.release();
    }
};
