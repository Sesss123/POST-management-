const db = require('../config/db');

/**
 * Logs a system action to the audit_logs table
 * @param {number} userId - ID of the user performing the action
 * @param {string} action - Description of the action (e.g., 'invoice_created')
 * @param {string} entityType - Type of entity (e.g., 'invoice', 'kot', 'settings')
 * @param {number} entityId - ID of the entity
 * @param {object} oldValue - Optional JSON of previous state
 * @param {object} newValue - Optional JSON of new state
 * @param {string} ipAddress - Optional IP address
 */
const logAction = async (userId, action, entityType = null, entityId = null, oldValue = null, newValue = null, ipAddress = null) => {
    try {
        const query = `
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            userId,
            action,
            entityType,
            entityId,
            oldValue ? JSON.stringify(oldValue) : null,
            newValue ? JSON.stringify(newValue) : null,
            ipAddress
        ];
        
        await db.execute(query, values);
    } catch (err) {
        console.error('Audit Log Error:', err);
        // We don't throw here to avoid breaking the main operation if logging fails
    }
};

module.exports = { logAction };
