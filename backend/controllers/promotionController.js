const { db } = require('../config/db');
const { logAction } = require('../utils/logger');

// @desc    Get all promotions
// @route   GET /api/promotions
// @access  Private
exports.getPromotions = async (req, res) => {
    try {
        const [promotions] = await db.query(`
            SELECT p.*, u.name as creator_name 
            FROM promotions p 
            LEFT JOIN users u ON p.created_by = u.id
            ORDER BY p.created_at DESC
        `);
        res.json({ success: true, data: promotions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get applicable promotions
// @route   GET /api/promotions/applicable
// @access  Private
exports.getApplicablePromotions = async (req, res) => {
    const { order_type, subtotal } = req.query;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];

    try {
        let query = `
            SELECT * FROM promotions 
            WHERE status = 'active' 
            AND start_date <= ? AND end_date >= ?
            AND (applicable_order_type = 'all' OR applicable_order_type = ?)
            AND min_order_amount <= ?
        `;
        const params = [today, today, order_type || 'all', subtotal || 0];

        const [promotions] = await db.query(query, params);
        
        // Filter by time if set
        const filtered = promotions.filter(p => {
            if (p.start_time && p.end_time) {
                return currentTime >= p.start_time && currentTime <= p.end_time;
            }
            return true;
        });

        res.json({ success: true, data: filtered });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create promotion
// @route   POST /api/promotions
// @access  Private/Admin
exports.createPromotion = async (req, res) => {
    const { name, type, value, start_date, end_date, start_time, end_time, min_order_amount, applicable_order_type } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO promotions 
            (name, type, value, start_date, end_date, start_time, end_time, min_order_amount, applicable_order_type, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, type, value, start_date, end_date, start_time || null, end_time || null, min_order_amount || 0, applicable_order_type || 'all', req.user.id]
        );

        await logAction(req.user.id, 'promotion_created', 'promotions', result.insertId, null, { name, type, value });

        const [newPromo] = await db.query('SELECT * FROM promotions WHERE id = ?', [result.insertId]);
        res.status(201).json({ success: true, data: newPromo[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete/Deactivate promotion
// @route   DELETE /api/promotions/:id
// @access  Private/Admin
exports.deletePromotion = async (req, res) => {
    try {
        await db.query('UPDATE promotions SET status = "inactive" WHERE id = ?', [req.params.id]);
        
        await logAction(req.user.id, 'promotion_deactivated', 'promotions', req.params.id, null, { status: 'inactive' });

        res.json({ success: true, message: 'Promotion deactivated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
