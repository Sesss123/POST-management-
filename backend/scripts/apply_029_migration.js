const { db } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('--- Starting Super Admin Final Polish Migration (029) ---');
    
    try {
        const migrationPath = path.join(__dirname, '../../database/migrations/029_super_admin_final_polish.sql');
        
        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Migration file not found at: ${migrationPath}`);
        }
        
        console.log(`Using migration file: ${migrationPath}`);
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        // Split by semicolon, handling simple cases
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);
            
        for (const statement of statements) {
            try {
                if (statement.startsWith('--')) continue;
                console.log(`Executing: ${statement.substring(0, 50)}...`);
                await db.query(statement);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.warn('Column already exists, skipping...');
                } else if (err.code === 'ER_DUP_KEYNAME') {
                    console.warn('Index already exists, skipping...');
                } else {
                    console.error(`Error executing statement: ${err.message}`);
                }
            }
        }
        
        console.log('--- Migration Completed Successfully ---');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
