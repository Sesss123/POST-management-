const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function createDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'restoledger_pos'}`);
        console.log('Database created or already exists');
        await connection.end();
    } catch (error) {
        console.error('Error creating database:', error.message);
        process.exit(1);
    }
}

createDatabase();
