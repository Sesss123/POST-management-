const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function check() {
    const c = await mysql.createConnection({ 
        host: process.env.DB_HOST || 'localhost', 
        user: process.env.DB_USER || 'root', 
        password: process.env.DB_PASSWORD || '', 
        database: process.env.DB_NAME || 'restoledgerdb' 
    });
    const [logs] = await c.query('SELECT * FROM audit_logs WHERE action = "rate_limit_login" ORDER BY created_at DESC LIMIT 1');
    if (logs.length > 0) {
        console.log('AUDIT LOG FOUND:');
        console.log(JSON.stringify(logs[0], null, 2));
    } else {
        console.log('NONE');
    }
    await c.end();
}
check().catch(console.error);
