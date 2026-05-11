const { db } = require('../config/db');
const { generateUuid } = require('../utils/identifier');
const { logAction } = require('../utils/logger');

// @desc    Get low stock items
// @route   GET /api/stock/low
exports.getLowStockItems = async (req, res) => {
    try {
        const query = `
            SELECT id, uuid, name, category, stock_qty, low_stock_threshold, availability_status
            FROM items
            WHERE shop_id = ? 
            AND track_stock = 1 
            AND (stock_qty <= low_stock_threshold OR availability_status = 'sold_out')
            AND status = 'active'
        `;
        const [items] = await db.query(query, [req.shopId]);
        res.json({ success: true, data: items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Adjust stock manually
// @route   POST /api/stock/adjust
exports.adjustStock = async (req, res) => {
    const { item_id, qty, type, reason } = req.body;
    
    if (!item_id || qty === undefined || !type) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get current stock
        const [items] = await connection.query('SELECT stock_qty, name FROM items WHERE id = ? AND shop_id = ?', [item_id, req.shopId]);
        if (items.length === 0) throw new Error('Item not found');
        const currentStock = parseFloat(items[0].stock_qty);
        const adjustmentQty = parseFloat(qty);
        
        let newStock = currentStock;
        if (type === 'adjustment') {
            newStock = adjustmentQty; // Set absolute value
        } else if (type === 'in') {
            newStock = currentStock + adjustmentQty;
        } else if (type === 'out') {
            newStock = currentStock - adjustmentQty;
        }

        // 2. Update item stock
        let availabilityStatus = 'available';
        if (newStock <= 0) {
            const [settings] = await connection.query('SELECT setting_value FROM settings WHERE setting_key = "auto_mark_sold_out_when_zero" AND shop_id = ?', [req.shopId]);
            if (settings.length > 0 && settings[0].setting_value === 'true') {
                availabilityStatus = 'sold_out';
            }
        }

        await connection.query(
            'UPDATE items SET stock_qty = ?, availability_status = ? WHERE id = ? AND shop_id = ?',
            [newStock, availabilityStatus, item_id, req.shopId]
        );

        // 3. Record movement
        const movementUuid = generateUuid();
        await connection.query(
            `INSERT INTO stock_movements (uuid, shop_id, item_id, qty, type, reason, balance_after, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [movementUuid, req.shopId, item_id, adjustmentQty, type, reason, newStock, req.user.id]
        );

        await logAction(req.user.id, 'stock_adjusted', 'item', item_id, null, { item_name: items[0].name, prev_stock: currentStock, new_stock: newStock, type, reason });

        await connection.commit();
        res.json({ success: true, message: 'Stock adjusted successfully', data: { new_stock: newStock } });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Stock adjustment failed' });
    } finally {
        connection.release();
    }
};

// @desc    Get stock movements for an item
// @route   GET /api/stock/movements/:itemId
exports.getStockMovements = async (req, res) => {
    try {
        const query = `
            SELECT sm.*, u.name as created_by_name
            FROM stock_movements sm
            LEFT JOIN users u ON sm.created_by = u.id
            WHERE sm.item_id = ? AND sm.shop_id = ?
            ORDER BY sm.created_at DESC
            LIMIT 50
        `;
        const [movements] = await db.query(query, [req.params.itemId, req.shopId]);
        res.json({ success: true, data: movements });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
