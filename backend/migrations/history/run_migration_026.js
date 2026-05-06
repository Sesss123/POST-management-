const { db } = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'migrations', '026_update_payment_enums.sql'), 'utf8');
        const commands = sql.split(';').filter(cmd => cmd.trim());
        
        for (let cmd of commands) {
            await db.query(cmd);
        }
        
        console.log('Migration 026 applied successfully');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
