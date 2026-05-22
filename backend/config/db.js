const mysql = require('mysql2');
const dotenv = require('dotenv');
const fs = require('fs');

const path = require('path');
// Search for .env in current, parent, or backend/
dotenv.config({ path: fs.existsSync('.env') ? '.env' : fs.existsSync('../.env') ? '../.env' : fs.existsSync('./backend/.env') ? './backend/.env' : '.env' });

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: process.env.DB_SSL === 'true' || (process.env.DB_HOST && !process.env.DB_HOST.includes('localhost') && !process.env.DB_HOST.includes('127.0.0.1'))
        ? { rejectUnauthorized: false }
        : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

const connectDB = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log(`>>> MySQL: Connected - ${process.env.DB_NAME}`);
        connection.release();
    } catch (error) {
        console.error(`MySQL Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = { connectDB, db: promisePool };
