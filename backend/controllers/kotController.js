const { db } = require('../config/db');
const { logAction } = require('../utils/logger');
const { buildIdOrUuidWhere, generateUuid } = require('../utils/identifier');
const socketService = require('../services/socketService');

// Helper to generate KOT number
const generateKOTNo = () => {
    return 'KOT-' + Date.now().toString().slice(-6);
};

// @desc    Create a new KOT from unsent items in a session
// @route   POST /api/table-sessions/:id/send-kot
// @access  Private
exports.createKOT = async (req, res) => {
    const sessionId = req.params.id || req.body.session_id;
    const { order_type } = req.body || {};
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Check if KOT printing is enabled
        const [settingsRows] = await connection.query('SELECT * FROM settings WHERE setting_key = "kot_printing_enabled" AND shop_id = ?', [req.shopId]);
        const kotEnabled = settingsRows.length > 0 ? settingsRows[0].setting_value === 'true' : true;
        
        if (!kotEnabled) {
            // If KOT is disabled globally, we might still want to track it in DB for Kitchen Display
            // but we can return a flag if the frontend needs to skip physical printing.
        }

        // 1.5 Auto-mark non-kitchen items as sent so they don't appear in KOT
        await connection.query(
            `UPDATE order_items oi
             JOIN items i ON oi.item_id = i.id
             SET oi.kot_sent = TRUE
             WHERE oi.session_id = ? AND i.send_to_kitchen = FALSE AND oi.combo_id IS NULL AND oi.status = "active" AND oi.shop_id = ?`,
            [sessionId, req.shopId]
        );

        // 2. Get unsent items for this session
        const [unsentItems] = await connection.query(
            'SELECT * FROM order_items WHERE session_id = ? AND kot_sent = FALSE AND status = "active" AND shop_id = ?',
            [sessionId, req.shopId]
        );

        if (unsentItems.length === 0) {
            await connection.commit();
            return res.json({ 
                success: true, 
                message: 'All items are already sent or no kitchen items found',
                data: { kot_id: null, printed: false }
            });
        }

        // 2. Get table ID and session details
        const [sessions] = await connection.query('SELECT table_id, order_type, waiter_id FROM table_sessions WHERE id = ? AND shop_id = ?', [sessionId, req.shopId]);
        if (sessions.length === 0) throw new Error('Session not found');
        const table_id = sessions[0].table_id;
        const session_order_type = sessions[0].order_type;
        const session_waiter_id = sessions[0].waiter_id;

        // 3. Create KOT order
        const kot_no = generateKOTNo();
        const kotUuid = generateUuid();
        const [kotResult] = await connection.query(
            `INSERT INTO kot_orders (uuid, kot_no, table_id, session_id, order_type, waiter_id, created_by, shop_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [kotUuid, kot_no, table_id, sessionId, session_order_type || order_type || 'dine_in', session_waiter_id, req.user.id, req.shopId]
        );
        const kotId = kotResult.insertId;

        // 4. Insert into kot_items and update order_items
        for (const item of unsentItems) {
            const itemUuid = generateUuid();
            if (item.combo_id) {
                await connection.query(
                    `INSERT INTO kot_items (uuid, kot_id, combo_id, item_name, qty, note, shop_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [itemUuid, kotId, item.combo_id, `[COMBO] ${item.item_name}`, item.qty, item.note, req.shopId]
                );
                const [components] = await connection.query(
                    'SELECT ci.qty, i.name FROM combo_items ci JOIN items i ON ci.item_id = i.id WHERE ci.combo_id = ? AND ci.shop_id = ?',
                    [item.combo_id, req.shopId]
                );
                for (const comp of components) {
                    const compUuid = generateUuid();
                    await connection.query(
                        `INSERT INTO kot_items (uuid, kot_id, combo_id, item_name, qty, note, shop_id)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [compUuid, kotId, item.combo_id, `  > ${comp.name}`, comp.qty * item.qty, 'Combo Component', req.shopId]
                    );
                }
            } else {
                // Fetch modifiers for this item to display in KOT
                const [itemMods] = await connection.query(
                    'SELECT modifier_name, modifier_type FROM order_item_modifiers WHERE order_item_id = ? AND shop_id = ?',
                    [item.id, req.shopId]
                );
                
                // Prefix with + for add-ons and - for removals
                const modifierText = itemMods.map(m => {
                    const prefix = m.modifier_type === 'remove' ? '- ' : '+ ';
                    return `${prefix}${m.modifier_name}`;
                }).join(', ');

                await connection.query(
                    `INSERT INTO kot_items (uuid, kot_id, item_id, item_name, qty, note, special_note, modifier_names, shop_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [itemUuid, kotId, item.item_id, item.item_name, item.qty, item.note, item.special_note, modifierText, req.shopId]
                );
            }

            await connection.query(
                'UPDATE order_items SET kot_sent = TRUE WHERE id = ? AND shop_id = ?',
                [item.id, req.shopId]
            );
        }

        await logAction(req.user.id, 'kot_created', 'kot_order', kotId, null, { kot_no, sessionId, items_count: unsentItems.length });

        await connection.commit();
        
        socketService.emitToShop(req.shopId, 'new_kot', { kot_id: kotId, kot_no });

        res.status(201).json({ 
            success: true, 
            message: 'KOT sent to kitchen', 
            data: { id: kotId, kot_no, kot_printing_enabled: kotEnabled } 
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    } finally {
        connection.release();
    }
};

// @desc    Create KOT from an existing Invoice (for Cash Sales/Takeaways)
// @route   POST /api/kot/invoice/:invoiceId
// @access  Private
exports.createKOTFromInvoice = async (req, res) => {
    const invoiceId = req.params.invoiceId;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Get Invoice details
        const where = buildIdOrUuidWhere('i', invoiceId);
        const [invoices] = await connection.query(`SELECT * FROM invoices i WHERE ${where.query} AND shop_id = ?`, [where.value, req.shopId]);
        if (invoices.length === 0) throw new Error('Invoice not found');
        const invoice = invoices[0];

        // 2. Get Invoice Items that should be sent to kitchen
        const [items] = await connection.query(
            `SELECT ii.*, i.send_to_kitchen 
             FROM invoice_items ii
             JOIN items i ON ii.item_id = i.id
             WHERE ii.invoice_id = ? AND i.send_to_kitchen = TRUE AND ii.shop_id = ?`,
            [invoice.id, req.shopId]
        );

        if (items.length === 0) {
            throw new Error('No kitchen items in this invoice');
        }

        // 3. Create KOT order
        const kot_no = generateKOTNo();
        const kotUuid = generateUuid();
        const [kotResult] = await connection.query(
            `INSERT INTO kot_orders (uuid, kot_no, invoice_id, table_id, session_id, order_type, waiter_id, created_by, shop_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [kotUuid, kot_no, invoice.id, invoice.table_id || null, invoice.session_id || null, invoice.order_type || 'takeaway', invoice.waiter_id, req.user.id, req.shopId]
        );
        const kotId = kotResult.insertId;

        // 4. Insert into kot_items
        for (const item of items) {
            const itemUuid = generateUuid();
            
            // Fetch modifiers for this invoice item
            const [itemMods] = await connection.query(
                'SELECT modifier_name, modifier_type FROM invoice_item_modifiers WHERE invoice_item_id = ? AND shop_id = ?',
                [item.id, req.shopId]
            );
            
            const modifierText = itemMods.map(m => {
                const prefix = m.modifier_type === 'remove' ? '- ' : '+ ';
                return `${prefix}${m.modifier_name}`;
            }).join(', ');

            await connection.query(
                `INSERT INTO kot_items (uuid, kot_id, item_id, item_name, qty, note, special_note, modifier_names, shop_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [itemUuid, kotId, item.item_id, item.item_name, item.qty, '', item.special_note, modifierText, req.shopId]
            );
        }

        await logAction(req.user.id, 'kot_created_from_invoice', 'kot_order', kotId, null, { kot_no, invoice_id: invoice.id });

        await connection.commit();

        socketService.emitToShop(req.shopId, 'new_kot', { kot_id: kotId, kot_no, invoice_id: invoice.id });

        res.status(201).json({ 
            success: true, 
            message: 'KOT sent to kitchen', 
            data: { id: kotId, kot_no } 
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    } finally {
        connection.release();
    }
};

// @desc    Get all KOTs (for listing)
// @route   GET /api/kot
// @access  Private
exports.getKOTs = async (req, res) => {
    try {
        const { date } = req.query;
        let query = `
            SELECT k.*, t.table_no, u.name as created_by_name
            FROM kot_orders k
            LEFT JOIN restaurant_tables t ON k.table_id = t.id
            LEFT JOIN users u ON k.created_by = u.id
            WHERE k.shop_id = ?
        `;
        const params = [req.shopId];
        if (date) {
            query += " AND DATE(k.created_at) = ?";
            params.push(date);
        }
        query += " ORDER BY k.created_at DESC";
        const [kots] = await db.query(query, params);
        res.json({ success: true, data: kots });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get single KOT details
// @route   GET /api/kot/:id
// @access  Private
exports.getKOTDetails = async (req, res) => {
    try {
        const where = buildIdOrUuidWhere('k', req.params.id);
        const [kots] = await db.query(
            `SELECT k.*, t.table_no, u.name as created_by_name
             FROM kot_orders k
             LEFT JOIN restaurant_tables t ON k.table_id = t.id
             LEFT JOIN users u ON k.created_by = u.id
             WHERE ${where.query} AND k.shop_id = ?`,
            [where.value, req.shopId]
        );

        if (kots.length === 0) return res.status(404).json({ success: false, message: 'KOT not found' });

        const kot = kots[0];
        const [items] = await db.query('SELECT * FROM kot_items WHERE kot_id = ? AND shop_id = ?', [kot.id, req.shopId]);
        
        kot.items = items;

        // Add restaurant settings for printing
        const [settingsRows] = await db.query('SELECT * FROM settings WHERE shop_id = ?', [req.shopId]);
        kot.settings = settingsRows.reduce((acc, s) => {
            acc[s.setting_key] = s.setting_value;
            return acc;
        }, {});

        res.json({ success: true, data: kot });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// End of KOT Controller

// @desc    Get all KOTs for a specific session
// @route   GET /api/kot/session/:sessionId
// @access  Private
exports.getKOTsBySession = async (req, res) => {
    try {
        const query = `
            SELECT k.*, t.table_no, u.name as created_by_name
            FROM kot_orders k
            LEFT JOIN restaurant_tables t ON k.table_id = t.id
            LEFT JOIN users u ON k.created_by = u.id
            WHERE k.session_id = ? AND k.shop_id = ?
            ORDER BY k.created_at DESC
        `;
        const [kots] = await db.query(query, [req.params.sessionId, req.shopId]);
        
        for (let kot of kots) {
            const [items] = await db.query('SELECT * FROM kot_items WHERE kot_id = ? AND shop_id = ?', [kot.id, req.shopId]);
            kot.items = items;
        }

        res.json({ success: true, data: kots });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
