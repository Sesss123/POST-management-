const crypto = require('crypto');

/**
 * RestoLedger CryptoVault
 * AES-256-GCM encryption for field-level data protection.
 * Requires DATA_ENCRYPTION_KEY in .env (32 bytes).
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

const getEncryptionKey = () => {
    const key = process.env.DATA_ENCRYPTION_KEY;
    if (!key) {
        throw new Error('CRITICAL: DATA_ENCRYPTION_KEY is not set in environment variables.');
    }
    // If key is provided as hex string, convert it, otherwise assume it's raw 32 chars
    if (key.length === 64) return Buffer.from(key, 'hex');
    if (key.length === 32) return Buffer.from(key);
    
    throw new Error('CRITICAL: DATA_ENCRYPTION_KEY must be exactly 32 bytes (or 64 hex characters).');
};

/**
 * Encrypt a string
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Combined string of iv:authTag:encryptedContent
 */
const encrypt = (text) => {
    if (!text) return text;
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypt a string
 * @param {string} encryptedData - String in format iv:authTag:encryptedContent
 * @returns {string} - Plain text
 */
const decrypt = (encryptedData) => {
    if (!encryptedData || !encryptedData.includes(':')) return encryptedData;
    
    try {
        const [ivHex, authTagHex, encryptedText] = encryptedData.split(':');
        
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
        
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (err) {
        console.error('[CryptoVault] Decryption failed:', err.message);
        return null; // Return null if decryption fails to avoid exposing corrupted data
    }
};

module.exports = { encrypt, decrypt };
