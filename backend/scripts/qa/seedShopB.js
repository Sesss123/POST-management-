const { db } = require('../../config/db');
async function run() {
    try {
        await db.query('INSERT INTO customers (name, phone, shop_id, uuid) VALUES (?, ?, ?, ?)', ['Test Cust 2', '0770000002', 2, 'test-uuid-2']);
        console.log('Customer B inserted');
        await db.query('INSERT INTO items (name, category, price, shop_id, uuid) VALUES (?, ?, ?, ?, ?)', ['Item B', 'Test', 500, 2, 'test-item-uuid-2']);
        console.log('Item B inserted');
    } catch (e) {
        console.error(e.message);
    }
    process.exit(0);
}
run();
