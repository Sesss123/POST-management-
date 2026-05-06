const { db } = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'migrations', '025_add_held_bill_id_to_transactions.sql'), 'utf8');
        const commands = sql.split(';').filter(cmd => cmd.trim());
        
        for (let cmd of commands) {
            await db.query(cmd);
        }
        
        console.log('Migration 025 applied successfully');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
