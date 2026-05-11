const { db } = require('../../config/db');

async function migrate() {
    try {
        console.log('Adding reset_token columns to users table...');
        
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL,
            ADD COLUMN reset_token_expires DATETIME DEFAULT NULL
        `);
        
        console.log('Migration successful!');
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
            console.log('Columns already exist, skipping migration.');
            process.exit(0);
        }
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
