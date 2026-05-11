const { db } = require('../../config/db');

const seedTestKots = async () => {
    try {
        const [shops] = await db.query('SELECT id FROM shops WHERE status = "active" LIMIT 2');
        if (shops.length < 2) return;

        const shopA = shops[0].id;
        const shopB = shops[1].id;

        // Create KOT for Shop B
        await db.query(`
            INSERT INTO kot_orders (uuid, kot_no, order_type, status, shop_id, created_at)
            VALUES (UUID(), 'KOT-TEST-B', 'dine_in', 'pending', ?, NOW())
        `, [shopB]);

        // Create KOT for Shop A
        await db.query(`
            INSERT INTO kot_orders (uuid, kot_no, order_type, status, shop_id, created_at)
            VALUES (UUID(), 'KOT-TEST-A', 'dine_in', 'pending', ?, NOW())
        `, [shopA]);

        console.log('Seeded test KOTs for Shop A and Shop B.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedTestKots();
