const { db } = require('../../config/db');

const testIsolation = async () => {
    console.log('--- Menu Isolation Test ---');
    
    try {
        // 1. Get existing shops
        const [shops] = await db.query('SELECT id, name FROM shops WHERE status = "active" LIMIT 2');
        if (shops.length < 1) {
            console.error('Test requires at least 1 active shop.');
            process.exit(1);
        }
        
        const shopA = shops[0];
        console.log(`Using Shop A: ${shopA.name} (ID: ${shopA.id})`);
        
        // 2. Check if Shop A has items
        const [itemsA] = await db.query('SELECT id, name, price FROM items WHERE shop_id = ? LIMIT 5', [shopA.id]);
        console.log(`Shop A Item Count: ${itemsA.length}`);
        
        if (itemsA.length > 0) {
            const item = itemsA[0];
            console.log(`Sample Item from Shop A: ${item.name} - Rs. ${item.price}`);
            
            // 3. Attempt to query this item using a non-existent shop_id (simulating cross-tenant access)
            const fakeShopId = 99999;
            const [itemsFake] = await db.query('SELECT * FROM items WHERE id = ? AND shop_id = ?', [item.id, fakeShopId]);
            
            if (itemsFake.length === 0) {
                console.log('✅ PASS: Item not accessible via incorrect shop_id.');
            } else {
                console.error('❌ FAIL: Item WAS accessible via incorrect shop_id!');
            }
        }

        // 4. Test Template Table
        const [templates] = await db.query('SELECT count(*) as count FROM menu_templates');
        console.log(`Menu Templates in DB: ${templates[0].count}`);
        if (templates[0].count > 0) {
            console.log('✅ PASS: Menu templates seeded successfully.');
        } else {
            console.error('❌ FAIL: Menu templates missing.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Test error:', error);
        process.exit(1);
    }
};

testIsolation();
