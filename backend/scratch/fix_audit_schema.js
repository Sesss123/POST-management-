const { db } = require('../config/db');

async function addColumn() {
    try {
        await db.query('ALTER TABLE audit_logs ADD COLUMN user_agent TEXT AFTER ip_address');
        console.log('Column user_agent added to audit_logs.');
    } catch (err) {
        console.error('Error adding column:', err.message);
    } finally {
        process.exit();
    }
}

addColumn();
