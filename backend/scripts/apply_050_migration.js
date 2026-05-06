const { db } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
    console.log('--- Starting Phase 15: External Delivery Integration Migration ---');
    
    try {
        const sqlPath = path.join(__dirname, '../../database/migrations/050_external_delivery.sql');
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
