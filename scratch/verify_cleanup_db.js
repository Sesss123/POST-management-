const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'backend/.env' });

async function verifyCleanup() {
    console.log('--- Phase 1: Fresh DB Setup ---');
    
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    };

    const testDbName = 'restoledger_test_cleanup';
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        
        // 1. Create fresh DB
        await connection.query(`DROP DATABASE IF EXISTS ${testDbName}`);
        await connection.query(`CREATE DATABASE ${testDbName}`);
        console.log(`- Created database: ${testDbName}`);
        
        await connection.query(`USE ${testDbName}`);

        // 2. Import Schema
        const schema = fs.readFileSync('database/schema.sql', 'utf8');
        await connection.query(schema);
        console.log('- schema.sql imported successfully');

        // 3. Import Seeds
        const seed = fs.readFileSync('database/seed.sql', 'utf8');
        await connection.query(seed);
        console.log('- seed.sql imported successfully');

        // 4. Confirm Tables
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`- Total Tables: ${tables.length}`);
        
        // 5. Confirm Users
        const [users] = await connection.query('SELECT name, role FROM users');
        console.log('- Users found:');
        users.forEach(u => console.log(`  > ${u.name} (${u.role})`));

        const requiredRoles = ['admin', 'cashier', 'kitchen'];
        const rolesFound = users.map(u => u.role);
        const allRolesExist = requiredRoles.every(r => rolesFound.includes(r));
        console.log(`- Admin/Cashier/Kitchen roles present: ${allRolesExist ? 'PASS' : 'FAIL'}`);

    } catch (err) {
        console.error('DB Setup Verification Failed:', err);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

verifyCleanup();
