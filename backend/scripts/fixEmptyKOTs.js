const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'backend/.env' });

async function fixEmptyKOTs() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    await conn.beginTransaction();
    try {
        const [rows] = await conn.query(`
            SELECT ko.id, ko.kot_no, ko.status, ko.note 
            FROM kot_orders ko 
            LEFT JOIN kot_items ki ON ki.kot_id = ko.id 
            GROUP BY ko.id 
            HAVING COUNT(ki.id) = 0
        `);

        for (const kot of rows) {
            console.log('Cancelling empty KOT:', kot.kot_no);
            const newNote = `${kot.note || ''} | Auto-cancelled: empty KOT during DB repair`.trim();
            await conn.query('UPDATE kot_orders SET status = "cancelled", note = ? WHERE id = ?', [newNote, kot.id]);
            
            await conn.query(
                'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
                [1, 'empty_kot_cancelled', 'kot_order', kot.id, JSON.stringify({ status: kot.status }), JSON.stringify({ status: 'cancelled' })]
            );
        }

        await conn.commit();
        console.log('Empty KOTs Processed:', rows.length);
    } catch (err) {
        await conn.rollback();
        console.error('KOT Fix Failed:', err);
    } finally {
        await conn.end();
    }
}

fixEmptyKOTs();
