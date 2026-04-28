const { db } = require('../config/db');
const { logAction } = require('../utils/logger');

// Helper to generate KOT number
const generateKOTNo = () => {
    return 'KOT-' + Date.now().toString().slice(-6);
};

// @desc    Create a new KOT from unsent items in a session
// @route   POST /api/table-sessions/:id/send-kot
// @access  Private
exports.createKOT = async (req, res) => {
    const sessionId = req.params.id || req.body.session_id;
    const { order_type } = req.body;
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

        // 2. Get unsent items for this session
        const [unsentItems] = await connection.query(
            'SELECT * FROM order_items WHERE session_id = ? AND kot_sent = FALSE AND status = "active"',
            [sessionId]
        );

        if (unsentItems.length === 0) {
            throw new Error('No new items to send to kitchen');
        }

        // 2. Get table ID from session
        const [sessions] = await connection.query('SELECT table_id FROM table_sessions WHERE id = ?', [sessionId]);
        if (sessions.length === 0) throw new Error('Session not found');
        const table_id = sessions[0].table_id;

        // 3. Create KOT order
        const kot_no = generateKOTNo();
        const [kotResult] = await connection.query(
            `INSERT INTO kot_orders (kot_no, table_id, session_id, order_type, created_by)
             VALUES (?, ?, ?, ?, ?)`,
            [kot_no, table_id, sessionId, order_type || 'dine_in', req.user.id]
        );
        const kotId = kotResult.insertId;

        // 4. Insert into kot_items and update order_items
        for (const item of unsentItems) {
            await connection.query(
                `INSERT INTO kot_items (kot_id, item_id, item_name, qty, note)
                 VALUES (?, ?, ?, ?, ?)`,
                [kotId, item.item_id, item.item_name, item.qty, item.note]
            );

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
        const [kots] = await db.query(
            `SELECT k.*, t.table_no, u.name as created_by_name
             FROM kot_orders k
             LEFT JOIN restaurant_tables t ON k.table_id = t.id
             LEFT JOIN users u ON k.created_by = u.id
             WHERE k.id = ?`,
            [req.params.id]
        );

        if (kots.length === 0) return res.status(404).json({ success: false, message: 'KOT not found' });

        const [items] = await db.query('SELECT * FROM kot_items WHERE kot_id = ?', [req.params.id]);
        
        const kot = kots[0];
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

// @desc    Update KOT status (Kitchen)
// @route   PATCH /api/kot/:id/status
// @access  Private
exports.updateKOTStatus = async (req, res) => {
    const { status } = req.body;
    try {
        await db.query('UPDATE kot_orders SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true, message: `KOT status updated to ${status}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update individual KOT item status
// @route   PATCH /api/kot/items/:id/status
// @access  Private
exports.updateKOTItemStatus = async (req, res) => {
    const { status } = req.body;
    try {
        await db.query('UPDATE kot_items SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true, message: `Item status updated to ${status}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all active KOTs for kitchen display
// @route   GET /api/kitchen/kots
// @access  Private
exports.getKitchenKOTs = async (req, res) => {
    try {
        const query = `
            SELECT k.*, t.table_no, u.name as created_by_name
            FROM kot_orders k
            LEFT JOIN restaurant_tables t ON k.table_id = t.id
            LEFT JOIN users u ON k.created_by = u.id
            WHERE k.status IN ('pending', 'preparing', 'ready')
            ORDER BY k.created_at ASC
        `;
        const [kots] = await db.query(query);
        
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
