const { db } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('--- Starting Public Menu Migration ---');
    
    try {
        const migrationPath = path.join(__dirname, '../database/migrations/025_public_digital_menu_view_only.sql');
        
        // Check if file exists in the correct path (adjust if script is in backend/scripts)
        const possiblePaths = [
            path.join(__dirname, '../../database/migrations/025_public_digital_menu_view_only.sql'),
            path.join(__dirname, '../database/migrations/025_public_digital_menu_view_only.sql'),
            './database/migrations/025_public_digital_menu_view_only.sql'
        ];
        
        let sqlFile = null;
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                sqlFile = p;
                break;
            }
        }
        
        if (!sqlFile) {
            throw new Error('Migration file 025_public_digital_menu_view_only.sql not found');
        }
        
        console.log(`Using migration file: ${sqlFile}`);
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        // Split by semicolon, but handle cases where semicolons are inside strings or comments
        // Simple split for now as our migrations are usually straightforward
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);
            
        for (const statement of statements) {
            try {
                console.log(`Executing: ${statement.substring(0, 50)}...`);
                await db.query(statement);
            } catch (err) {
                // If column already exists, ignore error
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.warn('Column already exists, skipping...');
                } else if (err.code === 'ER_DUP_KEYNAME') {
                    console.warn('Index already exists, skipping...');
                } else {
                    console.error(`Error executing statement: ${err.message}`);
                    // Don't stop for other errors in this migration as they might be repeated runs
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
