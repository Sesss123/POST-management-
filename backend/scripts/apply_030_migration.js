const { db } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('--- Starting Backup System Migration (030) ---');
    try {
        const migrationPath = path.join(__dirname, '../../database/migrations/030_backup_system_upgrade.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
            
        for (const statement of statements) {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            await db.query(statement);
        }
        
        console.log('--- Migration Completed Successfully ---');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
