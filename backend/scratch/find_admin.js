const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function findAdmin() {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        const [rows] = await db.query('SELECT name, email, role FROM users WHERE role = "admin" AND status = "active" LIMIT 1');
        console.log(JSON.stringify(rows));
        await db.end();
    } catch (err) {
        console.error(err);
    }
}

findAdmin();
