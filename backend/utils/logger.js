const { logAudit } = require('./auditLogger');

/**
 * Legacy wrapper for logAction to use the new audit system
 */
const logAction = async (userId, action, entityType = null, entityId = null, oldValue = null, newValue = null, ipAddress = null) => {
    await logAudit(null, {
        userId,
        action,
        entityType,
        entityId,
        oldValue,
        newValue,
        ipAddress
    });
};

module.exports = { logAction };
