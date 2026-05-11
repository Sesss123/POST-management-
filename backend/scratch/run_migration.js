const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'restoledgerdb',
        multipleStatements: true
    };

    const connection = await mysql.createConnection(config);
    
    let migrationFile = process.argv[2];
    if (!migrationFile) {
        const migrations = fs.readdirSync('database/migrations').filter(f => f.endsWith('.sql')).sort();
        migrationFile = migrations[migrations.length - 1];
    }
    
    const filePath = `database/migrations/${migrationFile}`;
    console.log(`Running migration: ${migrationFile}...`);
    
    const sql = fs.readFileSync(filePath, 'utf8');
    await connection.query(sql);
    console.log('Migration successful!');
    
    await connection.end();
}

run().catch(console.error);
