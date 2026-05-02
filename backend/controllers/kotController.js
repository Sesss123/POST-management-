const { db } = require('../config/db');
const { logAction } = require('../utils/logger');
const { buildIdOrUuidWhere, generateUuid } = require('../utils/identifier');

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
        const [settingsRows] = await connection.query('SELECT * FROM settings WHERE setting_key = "kot_printing_enabled"');
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
             WHERE oi.session_id = ? AND i.send_to_kitchen = FALSE AND oi.combo_id IS NULL AND oi.status = "active"`,
            [sessionId]
        );

        // 2. Get unsent items for this session
        const [unsentItems] = await connection.query(
            'SELECT * FROM order_items WHERE session_id = ? AND kot_sent = FALSE AND status = "active"',
            [sessionId]
        );

        if (unsentItems.length === 0) {
            throw new Error('No kitchen items to send');
        }

        // 2. Get table ID and session details
        const [sessions] = await connection.query('SELECT table_id, order_type, waiter_id FROM table_sessions WHERE id = ?', [sessionId]);
        if (sessions.length === 0) throw new Error('Session not found');
        const table_id = sessions[0].table_id;
        const session_order_type = sessions[0].order_type;
        const session_waiter_id = sessions[0].waiter_id;

        // 3. Create KOT order
        const kot_no = generateKOTNo();
        const kotUuid = generateUuid();
        const [kotResult] = await connection.query(
            `INSERT INTO kot_orders (uuid, kot_no, table_id, session_id, order_type, waiter_id, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [kotUuid, kot_no, table_id, sessionId, session_order_type || order_type || 'dine_in', session_waiter_id, req.user.id]
        );
        const kotId = kotResult.insertId;

        // 4. Insert into kot_items and update order_items
        for (const item of unsentItems) {
            const itemUuid = generateUuid();
            if (item.combo_id) {
                await connection.query(
                    `INSERT INTO kot_items (uuid, kot_id, combo_id, item_name, qty, note)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [itemUuid, kotId, item.combo_id, `[COMBO] ${item.item_name}`, item.qty, item.note]
                );
                const [components] = await connection.query(
                    'SELECT ci.qty, i.name FROM combo_items ci JOIN items i ON ci.item_id = i.id WHERE ci.combo_id = ?',
                    [item.combo_id]
                );
                for (const comp of components) {
                    const compUuid = generateUuid();
                    await connection.query(
                        `INSERT INTO kot_items (uuid, kot_id, combo_id, item_name, qty, note)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [compUuid, kotId, item.combo_id, `  > ${comp.name}`, comp.qty * item.qty, 'Combo Component']
                    );
                }
            } else {
                // Fetch modifiers for this item to display in KOT
                const [itemMods] = await connection.query(
                    'SELECT modifier_name FROM order_item_modifiers WHERE order_item_id = ?',
                    [item.id]
                );
                const modifierText = itemMods.map(m => m.modifier_name).join(', ');

                await connection.query(
                    `INSERT INTO kot_items (uuid, kot_id, item_id, item_name, qty, note, special_note, modifier_names)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [itemUuid, kotId, item.item_id, item.item_name, item.qty, item.note, item.special_note, modifierText]
                );
            }

            await connection.query(
                'UPDATE order_items SET kot_sent = TRUE WHERE id = ?',
                [item.id]
            );
        }

        await logAction(req.user.id, 'kot_created', 'kot_order', kotId, null, { kot_no, sessionId, items_count: unsentItems.length });

        await connection.commit();
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

// @desc    Get all KOTs (for listing)
// @route   GET /api/kot
// @access  Private
exports.getKOTs = async (req, res) => {
    try {
        const query = `
            SELECT k.*, t.table_no, u.name as created_by_name
            FROM kot_orders k
            LEFT JOIN restaurant_tables t ON k.table_id = t.id
            LEFT JOIN users u ON k.created_by = u.id
            ORDER BY k.created_at DESC
        `;
        const [kots] = await db.query(query);
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
             WHERE ${where.query}`,
            [where.value]
        );

        if (kots.length === 0) return res.status(404).json({ success: false, message: 'KOT not found' });

        const kot = kots[0];
        const [items] = await db.query('SELECT * FROM kot_items WHERE kot_id = ?', [kot.id]);
        
        kot.items = items;

        // Add restaurant settings for printing
        const [settingsRows] = await db.query('SELECT * FROM settings');
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
            WHERE k.session_id = ?
            ORDER BY k.created_at DESC
        `;
        const [kots] = await db.query(query, [req.params.sessionId]);
        
        for (let kot of kots) {
            const [items] = await db.query('SELECT * FROM kot_items WHERE kot_id = ?', [kot.id]);
            kot.items = items;
        }

        res.json({ success: true, data: kots });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
