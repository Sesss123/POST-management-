const { db } = require('../config/db');

async function updateSchema() {
    try {
        console.log('Updating shops table schema...');
        
        const [columns] = await db.query('SHOW COLUMNS FROM shops');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('has_marketing_center')) {
            await db.query('ALTER TABLE shops ADD COLUMN has_marketing_center BOOLEAN DEFAULT FALSE AFTER has_delivery_orders');
            console.log('Added has_marketing_center column.');
        }

        if (!columnNames.includes('has_quick_retail')) {
            await db.query('ALTER TABLE shops ADD COLUMN has_quick_retail BOOLEAN DEFAULT FALSE AFTER has_marketing_center');
            console.log('Added has_quick_retail column.');
        }

        console.log('Schema update completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Schema update failed:', err);
        process.exit(1);
    }
}

updateSchema();
