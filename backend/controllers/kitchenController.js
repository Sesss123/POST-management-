const { db } = require('../config/db');
const { logAction } = require('../utils/logger');
const { buildIdOrUuidWhere } = require('../utils/identifier');

// @desc    Get all active KOTs for kitchen display
// @route   GET /api/kitchen/kots
// @access  Private (Admin, Manager, Kitchen)
exports.getActiveKots = async (req, res) => {
    try {
        const { status, order_type } = req.query;
        
        let query = `
            SELECT k.id, k.uuid, k.kot_no, k.table_id, k.order_type, k.status, k.note, k.created_at, 
                   t.table_no, u.name as created_by_name
            FROM kot_orders k
            LEFT JOIN restaurant_tables t ON k.table_id = t.id
            LEFT JOIN users u ON k.created_by = u.id
            WHERE k.status IN ('pending', 'preparing', 'ready', 'served')
            AND DATE(k.created_at) = CURDATE()
            AND k.shop_id = ?
        `;
        
        const params = [req.shopId];
        if (status) {
            query += " AND k.status = ?";
            params.push(status);
        }
        if (order_type) {
            query += " AND k.order_type = ?";
            params.push(order_type);
        }
        
        query += " ORDER BY k.created_at ASC";
        
        const [kots] = await db.query(query, params);
        
        // Fetch items and modifiers for each KOT
        for (let kot of kots) {
            const [items] = await db.query(
                'SELECT id, uuid, item_name, qty, note, special_note, modifier_names, status FROM kot_items WHERE kot_id = ?', 
                [kot.id]
            );
            kot.items = items;
        }

        res.json({ success: true, data: kots });
    } catch (error) {
        console.error('KDS Active KOTs Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get KOT history (served and cancelled)
// @route   GET /api/kitchen/history
// @access  Private
exports.getHistoryKots = async (req, res) => {
    try {
        const { date, order_type } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];
        
        let query = `
            SELECT k.id, k.uuid, k.kot_no, k.table_id, k.order_type, k.status, k.note, k.cancel_reason, k.created_at, k.updated_at,
                   t.table_no, u.name as created_by_name
            FROM kot_orders k
            LEFT JOIN restaurant_tables t ON k.table_id = t.id
            LEFT JOIN users u ON k.created_by = u.id
            WHERE k.status IN ('served', 'cancelled')
            AND DATE(k.created_at) = ?
            AND k.shop_id = ?
        `;
        
        const params = [targetDate, req.shopId];
        if (order_type) {
            query += " AND k.order_type = ?";
            params.push(order_type);
        }
        
        query += " ORDER BY k.updated_at DESC LIMIT 50";
        
        const [kots] = await db.query(query, params);
        
        for (let kot of kots) {
            const [items] = await db.query(
                'SELECT id, uuid, item_name, qty, note, status FROM kot_items WHERE kot_id = ?', 
                [kot.id]
            );
            kot.items = items;
        }

        res.json({ success: true, data: kots });
    } catch (error) {
        console.error('KDS History Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update KOT status
// @route   PATCH /api/kitchen/kots/:id/status
// @access  Private
exports.updateKotStatus = async (req, res) => {
    const { status } = req.body;
    const kotId = req.params.id;

    const allowedStatuses = ['pending', 'preparing', 'ready', 'served'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const where = buildIdOrUuidWhere('k', req.params.id);
        // Check current status and shop_id ownership
        const [kots] = await connection.query(`SELECT id, status, kot_no FROM kot_orders k WHERE ${where.query} AND k.shop_id = ?`, [where.value, req.shopId]);
        if (kots.length === 0) throw new Error('KOT not found');
        
        const kotId = kots[0].id;
        
        const currentStatus = kots[0].status;
        const kot_no = kots[0].kot_no;

        // Transition validation
        const validTransitions = {
            'pending': ['preparing', 'ready', 'cancelled'],
            'preparing': ['ready', 'cancelled'],
            'ready': ['served', 'cancelled'],
            'served': [],
            'cancelled': []
        };

        if (!validTransitions[currentStatus].includes(status) && status !== currentStatus) {
            throw new Error(`Cannot move from ${currentStatus} to ${status}`);
        }

        // Update KOT order
        await connection.query(
            'UPDATE kot_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
            [status, kotId]
        );

        // Update all items in this KOT to the same status
        await connection.query('UPDATE kot_items SET status = ? WHERE kot_id = ?', [status, kotId]);

        await logAction(req.user.id, 'kot_status_updated', 'kot_order', kotId, null, { 
            kot_no, 
            old_status: currentStatus, 
            new_status: status 
        });

        await connection.commit();
        res.json({ success: true, message: `KOT ${kot_no} updated to ${status}` });
    } catch (error) {
        await connection.rollback();
        console.error('Update KOT Status Error:', error);
        res.status(400).json({ success: false, message: error.message || 'Server error' });
    } finally {
        connection.release();
    }
};

// @desc    Cancel KOT
// @route   PATCH /api/kitchen/kots/:id/cancel
// @access  Private
exports.cancelKot = async (req, res) => {
    const { reason } = req.body;
    const kotId = req.params.id;

    if (!reason) {
        return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
    }

    // Permission check: only admin, manager, or users with specific permission can cancel
    // For now, let's allow kitchen role as well if requested, but typically it needs supervisor
    if (!['admin', 'manager', 'kitchen'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Permission denied' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const where = buildIdOrUuidWhere('k', req.params.id);
        // Verify ownership and status
        const [kots] = await connection.query(`SELECT id, status, kot_no FROM kot_orders k WHERE ${where.query} AND k.shop_id = ?`, [where.value, req.shopId]);
        if (kots.length === 0) throw new Error('KOT not found');
        
        const kotId = kots[0].id;
        
        const currentStatus = kots[0].status;
        if (currentStatus === 'served') throw new Error('Cannot cancel a served KOT');

        await connection.query(
            'UPDATE kot_orders SET status = "cancelled", cancel_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
            [reason, kotId]
        );

        await connection.query('UPDATE kot_items SET status = "cancelled" WHERE kot_id = ?', [kotId]);

        await logAction(req.user.id, 'kot_cancelled', 'kot_order', kotId, null, { 
            kot_no: kots[0].kot_no, 
            reason 
        });

        await connection.commit();
        res.json({ success: true, message: 'KOT cancelled successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Cancel KOT Error:', error);
        res.status(400).json({ success: false, message: error.message || 'Server error' });
    } finally {
        connection.release();
    }
};

// @desc    Update single KOT item status
// @route   PATCH /api/kitchen/kot-items/:itemId/status
// @access  Private
exports.updateItemStatus = async (req, res) => {
    const { status } = req.body;
    const identifier = req.params.itemId;

    try {
        const where = buildIdOrUuidWhere('ki', identifier);
        // Scoped update to ensure item belongs to a KOT of the same shop
        await db.query(`
            UPDATE kot_items ki
            JOIN kot_orders ko ON ki.kot_id = ko.id
            SET ki.status = ? 
            WHERE ${where.query} AND ko.shop_id = ?
        `, [status, where.value, req.shopId]);
        res.json({ success: true, message: 'Item status updated' });
    } catch (error) {
        console.error('Update Item Status Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
