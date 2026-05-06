const { db } = require('../config/db');

async function migrate() {
    console.log('--- Starting Phase 14: Mobile App API Hardening Migration ---');
    
    try {
        // 1. Create idempotency_keys table
        await db.query(`
            CREATE TABLE IF NOT EXISTS idempotency_keys (
                id INT AUTO_INCREMENT PRIMARY KEY,
                idempotency_key VARCHAR(100) UNIQUE NOT NULL,
                shop_id INT NOT NULL,
                user_id INT NOT NULL,
                request_path VARCHAR(255) NOT NULL,
                response_body JSON NOT NULL,
                status_code INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_key_shop (idempotency_key, shop_id)
            )
        `);

        // 2. Add last_login_ip and last_login_at to users for device tracking
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS last_login_at DATETIME NULL,
            ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45) NULL
        `);

        console.log('--- Migration Complete ---');
        process.exit(0);
    } catch (error) {
        console.error('Migration Failed:', error);
        process.exit(1);
    }
}

migrate();
