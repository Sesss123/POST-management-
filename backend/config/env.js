const dotenv = require('dotenv');
const fs = require('fs');

const validateEnv = () => {
    dotenv.config();

    const requiredEnv = [
        'PORT',
        'DB_HOST',
        'DB_USER',
        'DB_PASSWORD',
        'DB_NAME',
        'JWT_SECRET',
        'JWT_EXPIRES_IN',
        'DATA_ENCRYPTION_KEY'
    ];

    const missing = [];
    requiredEnv.forEach(env => {
        if (process.env[env] === undefined) {
            missing.push(env);
        }
    });

    if (missing.length > 0) {
        console.error('CRITICAL: Missing required environment variables:');
        console.error(missing.join(', '));
        process.exit(1);
    }

    if (process.env.JWT_SECRET.length < 32) {
        console.warn('WARNING: JWT_SECRET is too short. Use at least 32 characters for better security.');
    }
};

module.exports = { validateEnv };
