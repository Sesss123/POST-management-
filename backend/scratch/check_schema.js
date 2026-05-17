const { db } = require('../config/db');

async function checkSchema() {
    try {
        const [columns] = await db.query('DESCRIBE reservations');
        console.log('Columns in reservations table:');
        columns.forEach(col => console.log(`- ${col.Field}`));
    } catch (error) {
        console.error('Error checking schema:', error);
    } finally {
        process.exit();
    }
}

checkSchema();
