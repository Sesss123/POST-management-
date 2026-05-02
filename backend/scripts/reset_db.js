const fs = require('fs');
const path = require('path');
const { db } = require('../config/db');

async function resetDatabase() {
    console.log('Starting Database Reset...');
    
    try {
        const schemaPath = path.join(__dirname, '../../database/consolidated_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        // Disable foreign key checks for dropping/truncating
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Get all tables
        const [tables] = await db.query('SHOW TABLES');
        const dbName = process.env.DB_NAME || 'restoledger_pos';
        const tableKey = `Tables_in_${dbName}`;
        
        console.log(`Found ${tables.length} tables to clear.`);
        
        for (const tableRow of tables) {
            const tableName = tableRow[tableKey];
            console.log(`Dropping table: ${tableName}`);
            await db.query(`DROP TABLE IF EXISTS ${tableName}`);
        }
        
        console.log('Re-creating schema from consolidated_schema.sql...');
        const statements = schemaSql.split(';').filter(s => s.trim() !== '');
        
        for (let statement of statements) {
            if (statement.trim()) {
                await db.query(statement);
            }
        }
        
        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Database Reset Successful!');
        
        // Seed initial admin user if needed
        console.log('Adding default admin user...');
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.query(
            'INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['Admin', 'admin@pos.com', hashedPassword, 'admin']
        );
        
        process.exit(0);
    } catch (error) {
        console.error('Database Reset Failed:', error);
        process.exit(1);
    }
}

resetDatabase();
