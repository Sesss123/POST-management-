const { db } = require('../config/db');

async function checkSchema() {
    try {
        const [rows] = await db.query('DESCRIBE audit_logs');
        console.log('Columns in audit_logs:', rows.map(r => r.Field));
    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        process.exit();
    }
}

checkSchema();
