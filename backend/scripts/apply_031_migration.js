const { db } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
    const sqlPath = path.join(__dirname, '../../database/migrations/031_loyalty_system.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    const connection = await db.getConnection();
    try {
        console.log('--- Starting Loyalty System Migration (031) ---');
        await connection.beginTransaction();
        
        // Split by semicolon but ignore semicolons inside strings or comments (simple split here as migration is clean)
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
            
        for (let statement of statements) {
            await connection.query(statement);
        }
        
        await connection.commit();
        console.log('--- Migration Completed Successfully ---');
        process.exit(0);
    } catch (error) {
        await connection.rollback();
        console.error('--- Migration Failed ---');
        console.error(error);
        process.exit(1);
    } finally {
        connection.release();
    }
}

applyMigration();
