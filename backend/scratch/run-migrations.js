const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

async function runMigrations() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'restoledger_pos',
            multipleStatements: true
        });

        const migrationPath = path.join(__dirname, '../../database/schema.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migrations...');
        await connection.query(sql);
        console.log('Migrations completed successfully');
        
        // Add initial admin user if not exists
        const [users] = await connection.query('SELECT id FROM users LIMIT 1');
        if (users.length === 0) {
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            await connection.query(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['Admin', 'admin@restoledger.com', hashedPassword, 'admin']
            );
            console.log('Initial admin user created: admin@restoledger.com / admin123');
        }

        await connection.end();
    } catch (error) {
        console.error('Error running migrations:', error.message);
        process.exit(1);
    }
}

runMigrations();
