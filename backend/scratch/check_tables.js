const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'backend/.env' });

async function check() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'restoledgerdb'
    };

    const connection = await mysql.createConnection(config);
    const [tables] = await connection.query('SHOW TABLES');
    const existing = tables.map(t => Object.values(t)[0]);

    const required = [
        'expenses', 
        'broadcast_announcements', 
        'sms_campaigns', 
        'sms_logs', 
        'delivery_orders', 
        'delivery_order_items'
    ];

    console.log('--- Missing Tables Check ---');
    required.forEach(t => {
        console.log(`${t.padEnd(25)}: ${existing.includes(t) ? 'EXISTS' : 'MISSING'}`);
    });

    await connection.end();
}

check().catch(console.error);
