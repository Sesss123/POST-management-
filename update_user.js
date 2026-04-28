const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config({ path: './backend/.env' });

async function update() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'restoledger_pos',
    });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password', salt);

    // Let's update the user to match what the frontend expects
    await connection.execute(`
        UPDATE users 
        SET email = 'admin@restopos.com', password = ?
        WHERE id = 1
    `, [hash]);

    const [rows] = await connection.execute('SELECT * FROM users');
    console.log('Updated user:', rows);
    connection.end();
}
update().catch(console.error);
