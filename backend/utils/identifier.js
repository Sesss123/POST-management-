const { randomUUID } = require('crypto');

/**
 * Check if a value is a valid numeric ID (positive integer)
 * @param {any} value 
 * @returns {boolean}
 */
const isNumericId = (value) => {
    return /^\d+$/.test(String(value)) && parseInt(value) > 0;
};

/**
 * Check if a value is a valid UUID
 * @param {any} value 
 * @returns {boolean}
 */
const isUuid = (value) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(String(value));
};

/**
 * Build a WHERE clause object for id or uuid
 * @param {string} alias - Table alias (e.g. 'i')
 * @param {string|number} identifier - The id or uuid
 * @returns {object} - { query: string, value: any }
 */
const buildIdOrUuidWhere = (alias, identifier) => {
    const prefix = alias ? `${alias}.` : '';
    if (isNumericId(identifier)) {
        return { query: `${prefix}id = ?`, value: parseInt(identifier) };
    }
    return { query: `${prefix}uuid = ?`, value: String(identifier) };
};

/**
 * Generate a new UUID
 * @returns {string}
 */
const generateUuid = () => {
    return randomUUID();
};

module.exports = {
    isNumericId,
    isUuid,
    buildIdOrUuidWhere,
    generateUuid
};
