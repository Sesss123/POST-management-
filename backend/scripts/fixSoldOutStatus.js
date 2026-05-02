const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'backend/.env' });

async function fixSoldOutStatus() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    await conn.beginTransaction();
    try {
        const [rows] = await conn.query('SELECT id, name, availability_status FROM items WHERE track_stock = 1 AND stock_qty <= 0 AND availability_status != "sold_out"');
        
        for (const item of rows) {
            console.log('Marking sold out:', item.name);
            await conn.query('UPDATE items SET availability_status = "sold_out" WHERE id = ?', [item.id]);
            
            await conn.query(
                'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
                [1, 'item_auto_marked_sold_out', 'item', item.id, JSON.stringify({ status: item.availability_status }), JSON.stringify({ status: 'sold_out' })]
            );
        }

        await conn.commit();
        console.log('Items Processed:', rows.length);
    } catch (err) {
        await conn.rollback();
        console.error('Sold Out Fix Failed:', err);
    } finally {
        await conn.end();
    }
}

fixSoldOutStatus();
