const { db } = require('../config/db');

const getLogs = async (req, res) => {
    try {
        const { action, user_id, entity_type, date_from, date_to, search } = req.query;
        
        let sql = `
            SELECT a.*, u.name as user_name 
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.shop_id = ?
        `;
        const params = [req.shopId];

        if (action) {
            sql += ' AND a.action = ?';
            params.push(action);
        }

        if (user_id) {
            sql += ' AND a.user_id = ?';
            params.push(user_id);
        }

        if (entity_type) {
            sql += ' AND a.entity_type = ?';
            params.push(entity_type);
        }

        if (date_from) {
            sql += ' AND a.created_at >= ?';
            params.push(date_from);
        }

        if (date_to) {
            sql += ' AND a.created_at <= ?';
            params.push(date_to + ' 23:59:59');
        }

        if (search) {
            sql += ' AND (a.action LIKE ? OR a.entity_type LIKE ? OR u.name LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        sql += ' ORDER BY a.created_at DESC LIMIT 1000';
        
        const [logs] = await db.query(sql, params);
        
        res.json({ success: true, data: logs });
    } catch (err) {
        console.error('Get Logs Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getLogs };
