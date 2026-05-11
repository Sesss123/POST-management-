const { db } = require('../config/db');

/**
 * Mask sensitive data in objects before logging
 * @param {object} obj - Object to mask
 * @returns {object} - Masked object
 */
const maskSensitiveData = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sensitiveKeys = [
        'password', 'token', 'secret', 'api_key', 'jwt', 'db_password', 
        'credit_card', 'card_number', 'cvv', 'pin', 'bank_account', 
        'account_number', 'encryption_key', 'otp'
    ];
    const maskedObj = Array.isArray(obj) ? [...obj] : { ...obj };
    
    for (const key in maskedObj) {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
            maskedObj[key] = '********';
        } else if (typeof maskedObj[key] === 'object') {
            maskedObj[key] = maskSensitiveData(maskedObj[key]);
        }
    }
    
    return maskedObj;
};

/**
 * Log a system action to the audit_logs table
 * @param {object} connectionOrPool - DB connection or pool to use (optional, defaults to promisePool)
 * @param {object} data - Audit data
 */
const logAudit = async (connectionOrPool, {
    userId,
    shopId = null,
    action,
    entityType,
    entityId = null,
    oldValue = null,
    newValue = null,
    ipAddress = null,
    userAgent = null
}) => {
    try {
        const conn = connectionOrPool || db;
        
        const sql = `
            INSERT INTO audit_logs (user_id, shop_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            userId || null,
            shopId || null,
            action,
            entityType,
            entityId,
            oldValue ? JSON.stringify(maskSensitiveData(oldValue)) : null,
            newValue ? JSON.stringify(maskSensitiveData(newValue)) : null,
            ipAddress,
            userAgent
        ];
        
        await conn.query(sql, values);
    } catch (err) {
        console.error('Audit Logging Failed:', err.message);
        // Do not throw to avoid breaking main transaction
    }
};

module.exports = { logAudit, maskSensitiveData };
