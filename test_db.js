const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config({ path: './backend/.env' });

async function test() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'restoledger_pos',
    });

    const [rows] = await connection.execute('SELECT * FROM users');
    console.log(rows);
    connection.end();
}
test().catch(console.error);
