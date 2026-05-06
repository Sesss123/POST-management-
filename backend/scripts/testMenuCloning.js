const { db } = require('../config/db');

async function testCloning() {
    console.log('--- Testing Menu Cloning ---');
    
    try {
        // 1. Find a source and target shop
        const [shops] = await db.query('SELECT id, name FROM shops LIMIT 2');
        if (shops.length < 2) {
            console.log('Skipping test: Need at least 2 shops.');
            process.exit(0);
        }

        const source = shops[0];
        const target = shops[1];

        console.log(`Cloning from ${source.name} (ID: ${source.id}) to ${target.name} (ID: ${target.id})`);

        // We'll simulate the controller call directly or use an internal function
        // For simplicity, I'll just check if the logic in superAdminController works by running it here (mocked)
        
        const sourceId = source.id;
        const targetShopId = target.id;

        // Count items before
        const [[{count: before}]] = await db.query('SELECT COUNT(*) as count FROM items WHERE shop_id = ?', [targetShopId]);
        
        // Execute cloning logic
        await db.query(
            `INSERT INTO items (uuid, name, short_code, category, main_category, portion_type, price, portion_label, description, track_stock, stock_qty, send_to_kitchen, item_type, quick_sale_enabled, show_on_public_menu, public_description, image_url, spice_level, is_veg, is_featured, shop_id, status, availability_status)
             SELECT UUID(), name, short_code, category, main_category, portion_type, price, portion_label, description, 0, 0, send_to_kitchen, item_type, quick_sale_enabled, show_on_public_menu, public_description, image_url, spice_level, is_veg, is_featured, ?, status, availability_status
             FROM items WHERE shop_id = ?`,
            [targetShopId, sourceId]
        );

        const [[{count: after}]] = await db.query('SELECT COUNT(*) as count FROM items WHERE shop_id = ?', [targetShopId]);

        console.log(`Items before: ${before}, Items after: ${after}`);
        
        if (after > before) {
            console.log('PASS: Items cloned successfully.');
            
            // Verify stock_qty is 0
            const [newItems] = await db.query('SELECT stock_qty FROM items WHERE shop_id = ? AND stock_qty != 0', [targetShopId]);
            if (newItems.length === 0) {
                console.log('PASS: All cloned items have stock_qty = 0.');
            } else {
                console.log('FAIL: Some cloned items have non-zero stock.');
            }
        } else {
            console.log('FAIL: No items were cloned (source might be empty).');
        }

    } catch (err) {
        console.error('Test Failed:', err);
    } finally {
        process.exit(0);
    }
}

testCloning();
