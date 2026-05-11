const { db } = require('../config/db');
const { generateUuid } = require('../utils/identifier');
const deliveryProviderService = require('../services/delivery/deliveryProviderService');
const { logAction } = require('../utils/logger');
const { calculateInvoiceTotals } = require('../utils/pricingCalculator');
const { getSystemSettings } = require('../utils/settingsHelper');

// @desc    Get all delivery orders
// @route   GET /api/delivery-orders
exports.getDeliveryOrders = async (req, res) => {
    try {
        const { status, source } = req.query;
        let query = 'SELECT * FROM delivery_orders WHERE shop_id = ?';
        const params = [req.shopId];

        if (status) {
            query += ' AND order_status = ?';
            params.push(status);
        }
        if (source) {
            query += ' AND source = ?';
            params.push(source);
        }

        query += ' ORDER BY created_at DESC';

        const [orders] = await db.query(query, params);
        
        // Fetch items for each order
        for (let order of orders) {
            const [items] = await db.query('SELECT * FROM delivery_order_items WHERE delivery_order_id = ? AND shop_id = ?', [order.id, req.shopId]);
            order.items = items;
        }

        res.json({ success: true, data: orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create manual delivery order
// @route   POST /api/delivery-orders/manual
exports.createManualOrder = async (req, res) => {
    const { 
        customer_name, 
        customer_phone, 
        delivery_address, 
        items, // [{ item_id, item_name, qty, unit_price, note }]
        delivery_fee,
        payment_method,
        note,
        source = 'manual_delivery'
    } = req.body;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const settings = await getSystemSettings(connection, req.shopId);
        
        // Prepare items for calculator
        const calcItems = items.map(item => ({
            ...item,
            total: item.qty * item.unit_price
        }));

        const totals = calculateInvoiceTotals({
            items: calcItems,
            settings: settings,
            order_type: 'delivery'
        });

        const subtotal = totals.subtotal;
        const grandTotal = totals.grand_total + (parseFloat(delivery_fee) || 0);

        const orderUuid = generateUuid();
        const [orderResult] = await connection.query(
            `INSERT INTO delivery_orders (
                uuid, shop_id, source, customer_name, customer_phone, delivery_address, 
                delivery_fee, subtotal, grand_total, payment_method, note, order_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [orderUuid, req.shopId, source, customer_name, customer_phone, delivery_address, delivery_fee || 0, subtotal, grandTotal, payment_method || 'cash', note, 'pending']
        );
        const orderId = orderResult.insertId;

        for (const item of items) {
            const itemUuid = generateUuid();
            await connection.query(
                `INSERT INTO delivery_order_items (
                    uuid, delivery_order_id, item_id, item_name, qty, unit_price, total, note, matched_status, shop_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [itemUuid, orderId, item.item_id || null, item.item_name, item.qty, item.unit_price, item.qty * item.unit_price, item.note || null, item.item_id ? 'matched' : 'manual', req.shopId]
            );
        }

        await connection.commit();
        res.status(201).json({ success: true, message: 'Manual delivery order created', data: { id: orderId, uuid: orderUuid } });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create manual order' });
    } finally {
        connection.release();
    }
};

// @desc    Sync orders from providers
// @route   POST /api/delivery-orders/sync-provider
exports.syncProviderOrders = async (req, res) => {
    try {
        const newOrders = await deliveryProviderService.syncOrders({ shopId: req.shopId });
        let createdCount = 0;

        for (const order of newOrders) {
            // Check if already exists
            const [existing] = await db.query('SELECT id FROM delivery_orders WHERE external_order_id = ? AND shop_id = ?', [order.externalOrderId, req.shopId]);
            
            if (existing.length === 0) {
                const connection = await db.getConnection();
                try {
                    await connection.beginTransaction();

                    const orderUuid = generateUuid();
                    const [orderResult] = await connection.query(
                        `INSERT INTO delivery_orders (
                            uuid, shop_id, source, external_order_id, customer_name, customer_phone, delivery_address, 
                            delivery_fee, platform_fee, subtotal, grand_total, payment_method, note, raw_payload, order_status
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            orderUuid, req.shopId, order.source, order.externalOrderId, 
                            order.customer.name, order.customer.phone, order.customer.address,
                            order.deliveryFee, order.platformFee, order.subtotal, order.grandTotal,
                            order.paymentMethod, order.note, JSON.stringify(order), 'pending'
                        ]
                    );
                    const orderId = orderResult.insertId;

                    for (const item of order.items) {
                        const itemUuid = generateUuid();
                        
                        // Try to match item by name
                        const [matched] = await connection.query('SELECT id FROM items WHERE name = ? AND shop_id = ? AND status = "active"', [item.externalItemName, req.shopId]);
                        const itemId = matched.length > 0 ? matched[0].id : null;

                        await connection.query(
                            `INSERT INTO delivery_order_items (
                                uuid, delivery_order_id, item_id, external_item_name, item_name, qty, unit_price, total, note, matched_status, shop_id
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [itemUuid, orderId, itemId, item.externalItemName, item.externalItemName, item.qty, item.unitPrice, item.qty * item.unitPrice, item.note || null, itemId ? 'matched' : 'unmatched', req.shopId]
                        );
                    }

                    await connection.commit();
                    createdCount++;
                } catch (err) {
                    await connection.rollback();
                    console.error(`[Sync Order Error] ${order.externalOrderId}`, err);
                } finally {
                    connection.release();
                }
            }
        }

        res.json({ success: true, message: `Sync complete. ${createdCount} new orders found.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Provider sync failed' });
    }
};

// @desc    Accept delivery order
// @route   POST /api/delivery-orders/:id/accept
exports.acceptOrder = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get delivery order
        const [orders] = await connection.query('SELECT * FROM delivery_orders WHERE (id = ? OR uuid = ?) AND shop_id = ?', [req.params.id, req.params.id, req.shopId]);
        if (orders.length === 0) throw new Error('Order not found');
        const order = orders[0];

        if (order.order_status !== 'pending') throw new Error(`Order is already ${order.order_status}`);

        // 2. Get items
        const [items] = await connection.query('SELECT * FROM delivery_order_items WHERE delivery_order_id = ? AND shop_id = ?', [order.id, req.shopId]);
        
        // 3. Create a POS session for this delivery
        const sessionUuid = generateUuid();
        const sessionNo = 'DLV-' + Date.now().toString().slice(-6);
        const [sessionResult] = await connection.query(
            `INSERT INTO table_sessions (uuid, session_no, shop_id, opened_by, order_type, customer_id, status)
             VALUES (?, ?, ?, ?, 'delivery', NULL, 'open')`,
            [sessionUuid, sessionNo, req.shopId, req.user.id]
        );
        const sessionId = sessionResult.insertId;

        // 4. Add items to session
        for (const item of items) {
            const itemUuid = generateUuid();
            await connection.query(
                `INSERT INTO order_items (uuid, session_id, item_id, item_name, qty, unit_price, total, note, shop_id, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [itemUuid, sessionId, item.item_id, item.item_name, item.qty, item.unit_price, item.total, item.note, req.shopId, req.user.id]
            );
        }

        // 5. Update delivery order status
        await connection.query(
            'UPDATE delivery_orders SET order_status = "accepted", accepted_by = ?, accepted_at = CURRENT_TIMESTAMP WHERE id = ? AND shop_id = ?',
            [req.user.id, order.id, req.shopId]
        );

        // 6. Acknowledge to provider if external
        if (order.external_order_id) {
            await deliveryProviderService.acknowledgeOrder(order.source, order.external_order_id);
        }

        await logAction(req.user.id, 'delivery_order_accepted', 'delivery_order', order.id, null, { session_no: sessionNo });

        await connection.commit();
        res.json({ success: true, message: 'Order accepted and POS session created', data: { session_id: sessionId, session_uuid: sessionUuid } });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Failed to accept order' });
    } finally {
        connection.release();
    }
};

// @desc    Reject delivery order
// @route   POST /api/delivery-orders/:id/reject
exports.rejectOrder = async (req, res) => {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Reject reason is required' });

    try {
        const [orders] = await db.query('SELECT * FROM delivery_orders WHERE (id = ? OR uuid = ?) AND shop_id = ?', [req.params.id, req.params.id, req.shopId]);
        if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });
        const order = orders[0];

        await db.query(
            'UPDATE delivery_orders SET order_status = "rejected", rejected_by = ?, rejected_at = CURRENT_TIMESTAMP, reject_reason = ? WHERE id = ? AND shop_id = ?',
            [req.user.id, order.id, reason, req.shopId]
        );

        if (order.external_order_id) {
            await deliveryProviderService.rejectOrder(order.source, order.external_order_id, reason);
        }

        await logAction(req.user.id, 'delivery_order_rejected', 'delivery_order', order.id, null, { reason });

        res.json({ success: true, message: 'Order rejected' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update delivery status
// @route   PATCH /api/delivery-orders/:id/status
exports.updateStatus = async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    try {
        const [orders] = await db.query('SELECT * FROM delivery_orders WHERE (id = ? OR uuid = ?) AND shop_id = ?', [req.params.id, req.params.id, req.shopId]);
        if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });
        const order = orders[0];

        await db.query('UPDATE delivery_orders SET order_status = ? WHERE id = ? AND shop_id = ?', [status, order.id, req.shopId]);

        if (order.external_order_id) {
            await deliveryProviderService.updateStatus(order.source, order.external_order_id, status);
        }

        await logAction(req.user.id, 'delivery_order_status_changed', 'delivery_order', order.id, null, { status });

        res.json({ success: true, message: `Status updated to ${status}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

