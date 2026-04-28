const { db } = require('../config/db');

/**
 * Log an action to the audit_logs table
 */
const logAction = async (userId, action, entityType = null, entityId = null, oldValue = null, newValue = null, ipAddress = null) => {
    try {
        const query = `
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(query, [
            userId,
            action,
            entityType,
            entityId,
            oldValue ? JSON.stringify(oldValue) : null,
            newValue ? JSON.stringify(newValue) : null,
            ipAddress
        ]);
    } catch (error) {
        console.error('Failed to log audit action:', error);
    }
};

module.exports = { logAction };
