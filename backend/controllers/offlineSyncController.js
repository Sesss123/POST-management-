const { db } = require('../config/db');
const { generateUuid } = require('../utils/identifier');
const { logAction } = require('../utils/logger');
const { 
    generateInvoiceNo, 
    getSystemSettings, 
    deductStock 
} = require('./invoiceController');

// Helper to log conflict
const logConflict = async (connection, { shopId, userId, idempotency_key, conflict_type, conflict_details, request_payload, draft_id }) => {
    // Save to offline_sync_records
    const syncUuid = generateUuid();
    await connection.query(
        `INSERT INTO offline_sync_records (uuid, shop_id, user_id, idempotency_key, draft_type, request_payload, response_payload, status, conflict_type, conflict_details)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'failed', ?, ?)
         ON DUPLICATE KEY UPDATE status = 'failed', conflict_type = ?, conflict_details = ?, retry_count = retry_count + 1`,
        [
            syncUuid, shopId, userId, idempotency_key, request_payload.type || 'unknown', 
            JSON.stringify(request_payload), JSON.stringify({ message: 'Conflict detected' }), 
            conflict_type, JSON.stringify(conflict_details),
            conflict_type, JSON.stringify(conflict_details)
        ]
    );

    // Save to offline_conflict_logs
    await connection.query(
        `INSERT INTO offline_conflict_logs (uuid, shop_id, user_id, draft_id, idempotency_key, conflict_type, conflict_details)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [generateUuid(), shopId, userId, draft_id || idempotency_key, idempotency_key, conflict_type, JSON.stringify(conflict_details)]
    );
};

exports.syncDraft = async (req, res) => {
    const { idempotency_key, type, items, payment_method, cash_received, offline_created_at, draft_id } = req.body;
    const shopId = req.shopId;
    const userId = req.user.id;

    // VALIDATION 9: INVALID PAYLOAD
    if (!idempotency_key || !items || items.length === 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'Offline draft conflict detected',
            conflict: { type: 'invalid_payload', details: { message: 'idempotency_key and items are required' }, resolution_options: ['cancel_draft'] }
        });
    }

    if (payment_method !== 'cash') {
        return res.status(400).json({ 
            success: false, 
            message: 'Offline draft conflict detected',
            conflict: { type: 'invalid_payload', details: { message: 'Only cash payments are supported' }, resolution_options: ['cancel_draft'] }
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // VALIDATION 6: USER INACTIVE
        const [userData] = await connection.query('SELECT status FROM users WHERE id = ? AND shop_id = ?', [userId, shopId]);
        if (userData.length === 0 || userData[0].status !== 'active') {
            await logConflict(connection, { shopId, userId, idempotency_key, conflict_type: 'user_inactive', conflict_details: { message: 'User account is inactive' }, request_payload: req.body, draft_id });
            await connection.commit();
            return res.status(400).json({ success: false, message: 'Offline draft conflict detected', conflict: { type: 'user_inactive', details: { message: 'User is inactive' }, resolution_options: ['cancel_draft'] }});
        }

        // VALIDATION 5: SUBSCRIPTION LOCKED
        const [shopData] = await connection.query('SELECT subscription_status FROM shops WHERE id = ?', [shopId]);
        if (shopData.length === 0 || !['active', 'trial'].includes(shopData[0].subscription_status)) {
            await logConflict(connection, { shopId, userId, idempotency_key, conflict_type: 'subscription_locked', conflict_details: { status: shopData[0]?.subscription_status }, request_payload: req.body, draft_id });
            await connection.commit();
            return res.status(400).json({ success: false, message: 'Offline draft conflict detected', conflict: { type: 'subscription_locked', details: { status: shopData[0]?.subscription_status }, resolution_options: ['cancel_draft', 'retry_sync'] }});
        }

        // VALIDATION 7: DUPLICATE SYNC
        const [existingRecords] = await connection.query(
            'SELECT * FROM offline_sync_records WHERE idempotency_key = ? AND shop_id = ? FOR UPDATE',
            [idempotency_key, shopId]
        );

        if (existingRecords.length > 0) {
            const record = existingRecords[0];
            if (record.status === 'processed') {
                await connection.rollback();
                return res.json({
                    success: true,
                    message: 'Draft already synced',
                    data: JSON.parse(record.response_payload)
                });
            }
            // If it failed previously, we will try again now.
        }

        const settings = await getSystemSettings(connection, shopId);
        
        let subtotal = 0;
        const processedItems = [];
        let priceChanged = false;
        const warnings = [];
        let oldEstimatedSubtotal = 0;

        for (const itemInput of items) {
            oldEstimatedSubtotal += parseFloat(itemInput.unit_price || itemInput.price || 0) * parseInt(itemInput.qty || 1);

            if (itemInput.is_combo) {
                const [comboData] = await connection.query('SELECT name, price, status FROM combo_meals WHERE id = ? AND shop_id = ?', [itemInput.id || itemInput.item_id, shopId]);
                // VALIDATION 4: ITEM NOT FOUND
                if (comboData.length === 0) {
                    await logConflict(connection, { shopId, userId, idempotency_key, conflict_type: 'item_not_found', conflict_details: { item_name: itemInput.name || itemInput.item_name }, request_payload: req.body, draft_id });
                    await connection.commit();
                    return res.status(400).json({ success: false, message: 'Offline draft conflict detected', conflict: { type: 'item_not_found', details: { item_name: itemInput.name || itemInput.item_name }, resolution_options: ['remove_item', 'cancel_draft'] }});
                }
                // VALIDATION 3: ITEM UNAVAILABLE
                if (comboData[0].status !== 'active') {
                    await logConflict(connection, { shopId, userId, idempotency_key, conflict_type: 'item_unavailable', conflict_details: { item_name: comboData[0].name }, request_payload: req.body, draft_id });
                    await connection.commit();
                    return res.status(400).json({ success: false, message: 'Offline draft conflict detected', conflict: { type: 'item_unavailable', details: { item_name: comboData[0].name }, resolution_options: ['remove_item', 'cancel_draft'] }});
                }

                const currentPrice = comboData[0].price;
                const inputPrice = itemInput.unit_price || itemInput.price;
                // VALIDATION 1: PRICE CHANGED
                if (parseFloat(currentPrice) !== parseFloat(inputPrice)) {
                    priceChanged = true;
                    warnings.push({ type: 'price_changed', message: `Price for ${comboData[0].name} changed from ${inputPrice} to ${currentPrice}`, old_price: inputPrice, new_price: currentPrice });
                }
                
                const itemTotal = currentPrice * itemInput.qty;
                subtotal += itemTotal;

                processedItems.push({
                    item_id: itemInput.id || itemInput.item_id,
                    item_name: comboData[0].name,
                    qty: itemInput.qty,
                    unit_price: currentPrice,
                    modifier_total: 0,
                    total: itemTotal,
                    item_type: 'combo',
                    no_receipt_item: false
                });
            } else {
                const [itemData] = await connection.query('SELECT name, price, status, track_stock, stock_quantity, no_receipt_default FROM items WHERE id = ? AND shop_id = ?', [itemInput.id || itemInput.item_id, shopId]);
                // VALIDATION 4: ITEM NOT FOUND
                if (itemData.length === 0) {
                    await logConflict(connection, { shopId, userId, idempotency_key, conflict_type: 'item_not_found', conflict_details: { item_name: itemInput.name || itemInput.item_name }, request_payload: req.body, draft_id });
                    await connection.commit();
                    return res.status(400).json({ success: false, message: 'Offline draft conflict detected', conflict: { type: 'item_not_found', details: { item_name: itemInput.name || itemInput.item_name }, resolution_options: ['remove_item', 'cancel_draft'] }});
                }
                // VALIDATION 3: ITEM UNAVAILABLE
                if (itemData[0].status !== 'active') {
                    await logConflict(connection, { shopId, userId, idempotency_key, conflict_type: 'item_unavailable', conflict_details: { item_name: itemData[0].name }, request_payload: req.body, draft_id });
                    await connection.commit();
                    return res.status(400).json({ success: false, message: 'Offline draft conflict detected', conflict: { type: 'item_unavailable', details: { item_name: itemData[0].name }, resolution_options: ['remove_item', 'cancel_draft'] }});
                }
                
                // VALIDATION 2: INSUFFICIENT STOCK
                if (itemData[0].track_stock === 1 && itemData[0].stock_quantity < itemInput.qty) {
                    await logConflict(connection, { shopId, userId, idempotency_key, conflict_type: 'insufficient_stock', conflict_details: { item_name: itemData[0].name, requested_qty: itemInput.qty, available_qty: itemData[0].stock_quantity }, request_payload: req.body, draft_id });
                    await connection.commit();
                    return res.status(400).json({ success: false, message: 'Offline draft conflict detected', conflict: { type: 'insufficient_stock', details: { item_name: itemData[0].name, requested_qty: itemInput.qty, available_qty: itemData[0].stock_quantity }, resolution_options: ['edit_draft', 'remove_item', 'cancel_draft'] }});
                }

                const currentPrice = itemData[0].price;
                const inputPrice = itemInput.unit_price || itemInput.price;
                // VALIDATION 1: PRICE CHANGED
                if (parseFloat(currentPrice) !== parseFloat(inputPrice)) {
                    priceChanged = true;
                    warnings.push({ type: 'price_changed', message: `Price for ${itemData[0].name} changed from ${inputPrice} to ${currentPrice}`, old_price: inputPrice, new_price: currentPrice });
                }

                const itemTotal = currentPrice * itemInput.qty;
                subtotal += itemTotal;

                processedItems.push({
                    item_id: itemInput.id || itemInput.item_id,
                    item_name: itemData[0].name,
                    qty: itemInput.qty,
                    unit_price: currentPrice,
                    modifier_total: 0,
                    total: itemTotal,
                    item_type: 'item',
                    no_receipt_item: !!itemData[0].no_receipt_default
                });
            }
        }

        const taxEnabled = settings.tax_enabled === 'true';
        const scEnabled = settings.service_charge_enabled === 'true';
        const taxRate = taxEnabled ? parseFloat(settings.tax_rate || 0) : 0;
        const scRate = scEnabled ? parseFloat(settings.service_charge_rate || 0) : 0;
        
        const taxAmount = (subtotal * taxRate) / 100;
        const scAmount = (subtotal * scRate) / 100;
        const grand_total = subtotal + taxAmount + scAmount;

        const oldTaxAmount = (oldEstimatedSubtotal * taxRate) / 100;
        const oldScAmount = (oldEstimatedSubtotal * scRate) / 100;
        const oldEstimatedTotal = oldEstimatedSubtotal + oldTaxAmount + oldScAmount;

        // VALIDATION 1B: CASH INSUFFICIENT DUE TO PRICE CHANGE
        const cashReceivedVal = parseFloat(cash_received || 0);
        if (priceChanged) {
            const allowPriceChangeSync = settings.offline_allow_price_change_sync !== 'false';
            
            if (!allowPriceChangeSync) {
                await logConflict(connection, { shopId, userId, idempotency_key, conflict_type: 'price_changed', conflict_details: { message: 'Prices changed and auto-sync is disabled', old_total: oldEstimatedTotal, new_total: grand_total }, request_payload: req.body, draft_id });
                await connection.commit();
                return res.status(400).json({ success: false, message: 'Offline draft conflict detected', conflict: { type: 'price_changed', details: { message: 'Prices changed and auto-sync is disabled', old_total: oldEstimatedTotal, new_total: grand_total }, resolution_options: ['accept_new_price', 'edit_draft', 'cancel_draft'] }});
            }

            if (cashReceivedVal < grand_total && type === 'quick_retail') {
                // Cash sales will enforce this too if required, but especially quick retail
                await logConflict(connection, { shopId, userId, idempotency_key, conflict_type: 'insufficient_cash', conflict_details: { old_total: oldEstimatedTotal, new_total: grand_total, cash_received: cashReceivedVal }, request_payload: req.body, draft_id });
                await connection.commit();
                return res.status(400).json({ success: false, message: 'Offline draft conflict detected', conflict: { type: 'insufficient_cash', details: { old_total: oldEstimatedTotal, new_total: grand_total, cash_received: cashReceivedVal }, resolution_options: ['edit_draft', 'cancel_draft'] }});
            }
        }

        const invoice_no = generateInvoiceNo();
        const invoiceUuid = generateUuid();
        
        const [invoiceResult] = await connection.query(
            `INSERT INTO invoices (
                uuid, invoice_no, invoice_type, order_type, waiter_id, 
                payment_status, payment_method, subtotal, discount_type, discount_value, discount, 
                tax_rate, tax_amount, service_charge_rate, service_charge_amount,
                grand_total, paid_amount, balance_amount, created_by,
                sale_channel, no_receipt, sale_type, shop_id,
                currency_code, currency_symbol, tax_name, tax_inclusive,
                receipt_restaurant_name, receipt_restaurant_phone, receipt_restaurant_address, receipt_footer_message, receipt_logo_url, created_at
            ) VALUES (?, ?, ?, ?, ?, 'paid', 'cash', ?, 'fixed', 0, 0, ?, ?, ?, ?, ?, ?, 0, ?, 'normal', false, 'restaurant', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                invoiceUuid, invoice_no, type, 'takeaway', userId,
                subtotal, taxRate, taxAmount, scRate, scAmount,
                grand_total, grand_total, userId, shopId,
                settings.currency_code || 'LKR', settings.currency_symbol || 'Rs.', settings.tax_name || 'VAT', settings.tax_inclusive === 'true' ? 1 : 0,
                settings.restaurant_name || settings.shop_name, settings.restaurant_phone, settings.restaurant_address, settings.receipt_footer_message, settings.receipt_logo_url,
                offline_created_at ? new Date(offline_created_at) : new Date()
            ]
        );
        const invoiceId = invoiceResult.insertId;

        for (const item of processedItems) {
            await connection.query(
                `INSERT INTO invoice_items (uuid, invoice_id, item_id, item_name, qty, unit_price, modifier_total, total, no_receipt_item, shop_id)
                 VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
                [generateUuid(), invoiceId, item.item_id, item.item_name, item.qty, item.unit_price, item.total, item.no_receipt_item ? 1 : 0, shopId]
            );
        }

        await connection.query(
            `INSERT INTO invoice_payments (uuid, invoice_id, payment_method, amount, shop_id)
             VALUES (?, ?, ?, ?, ?)`,
            [generateUuid(), invoiceId, 'cash', grand_total, shopId]
        );

        await deductStock(connection, processedItems, invoiceId, shopId, userId);

        const responsePayload = {
            invoice_id: invoiceId,
            invoice_no: invoice_no,
            server_total: grand_total,
            warnings: warnings
        };

        const syncUuid = generateUuid();
        await connection.query(
            `INSERT INTO offline_sync_records (uuid, shop_id, user_id, idempotency_key, draft_type, request_payload, response_payload, status, invoice_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'processed', ?)
             ON DUPLICATE KEY UPDATE status = 'processed', response_payload = ?, invoice_id = ?`,
            [syncUuid, shopId, userId, idempotency_key, type, JSON.stringify(req.body), JSON.stringify(responsePayload), invoiceId, JSON.stringify(responsePayload), invoiceId]
        );

        await logAction(userId, 'offline_draft_synced', 'invoice', invoiceId, null, { invoice_no, idempotency_key, warnings_count: warnings.length });

        await connection.commit();

        res.status(201).json({
            success: true,
            message: priceChanged ? 'Draft synced with warnings' : 'Draft synced successfully',
            data: responsePayload
        });

    } catch (error) {
        await connection.rollback();
        console.error('Offline Sync Error:', error);
        
        try {
            const conn = await db.getConnection();
            await logConflict(conn, { shopId, userId, idempotency_key, conflict_type: 'unknown_error', conflict_details: { message: error.message }, request_payload: req.body, draft_id });
            conn.release();
        } catch (dbErr) {
            console.error('Failed to log unknown error conflict:', dbErr);
        }

        res.status(400).json({ success: false, message: error.message || 'Failed to sync offline draft' });
    } finally {
        connection.release();
    }
};

exports.getSummary = async (req, res) => {
    try {
        const shopId = req.shopId;
        
        const [stats] = await db.query(`
            SELECT 
                COUNT(CASE WHEN status = 'processed' THEN 1 END) as synced_today,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_drafts
            FROM offline_sync_records 
            WHERE shop_id = ? AND DATE(created_at) = CURDATE()
        `, [shopId]);

        const [conflictStats] = await db.query(`
            SELECT conflict_type, COUNT(*) as count 
            FROM offline_conflict_logs 
            WHERE shop_id = ? AND DATE(created_at) = CURDATE()
            GROUP BY conflict_type
            ORDER BY count DESC
        `, [shopId]);

        res.json({
            success: true,
            data: {
                synced_drafts_today: stats[0].synced_today || 0,
                failed_drafts: stats[0].failed_drafts || 0,
                conflict_count: conflictStats.reduce((sum, row) => sum + row.count, 0),
                top_conflicts: conflictStats
            }
        });
    } catch (error) {
        console.error('Error fetching offline sync summary:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
