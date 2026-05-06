const { db } = require('../config/db');
const { logAction } = require('../utils/logger');
const { generateUuid } = require('../utils/identifier');

// @desc    Get all announcements
// @route   GET /api/super-admin/announcements
// @access  Private/SuperAdmin
exports.getAnnouncements = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM broadcast_announcements ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create and Broadcast an announcement
// @route   POST /api/super-admin/announcements
// @access  Private/SuperAdmin
exports.createAnnouncement = async (req, res) => {
    const { title, message, type = 'info', target_shop_id = null, expires_at = null } = req.body;
    try {
        const uuid = generateUuid();
        const [result] = await db.query(
            'INSERT INTO broadcast_announcements (uuid, title, message, type, target_shop_id, expires_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [uuid, title, message, type, target_shop_id, expires_at, req.user.id]
        );
        
        await logAction(req.user.id, 'announcement_broadcasted', 'announcement', result.insertId, null, { title, type });
        
        res.status(201).json({ 
            success: true, 
            message: 'Announcement broadcasted successfully', 
            data: { id: result.insertId, uuid } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete an announcement
// @route   DELETE /api/super-admin/announcements/:id
// @access  Private/SuperAdmin
exports.deleteAnnouncement = async (req, res) => {
    try {
        await db.query('DELETE FROM broadcast_announcements WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Announcement deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// --- Shop Side Announcement Routes ---

// @desc    Get active announcements for current shop
// @route   GET /api/announcements/active
// @access  Private
exports.getActiveAnnouncements = async (req, res) => {
    try {
        const query = `
            SELECT id, title, message, type, created_at 
            FROM broadcast_announcements 
            WHERE (target_shop_id IS NULL OR target_shop_id = ?) 
            AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
            ORDER BY created_at DESC
        `;
        const [rows] = await db.query(query, [req.shopId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
