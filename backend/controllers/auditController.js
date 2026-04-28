const { db } = require('../config/db');

const getLogs = async (req, res) => {
    try {
        const [logs] = await db.execute(`
            SELECT a.*, u.name as user_name 
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
            LIMIT 500
        `);
        
        res.json({ success: true, data: logs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getLogs };
