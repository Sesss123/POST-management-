const { db } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
    console.log('--- Starting Phase 17: Inventory Stock Management Migration ---');
    
    try {
        const sqlPath = path.join(__dirname, '../../database/migrations/051_inventory_stock_management.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon and filter empty statements
        const statements = sql
            .split(/;\s*$/m)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            await db.query(statement);
        }

        console.log('--- Migration Complete ---');
        process.exit(0);
    } catch (error) {
        console.error('Migration Failed:', error);
        process.exit(1);
    }
}

migrate();
