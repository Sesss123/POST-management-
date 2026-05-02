const { db } = require('../config/db');

async function seedQuickRetailItems() {
    console.log('Starting Quick Retail Item Seeding...');
    
    const itemsToSeed = [
        // 1. Cigarettes / Restricted Retail
        {
            name: 'Cigarette Gold Leaf - Single Stick',
            category: 'Restricted Retail',
            main_category: 'Retail',
            price: 105,
            item_type: 'Restricted Retail',
            send_to_kitchen: false,
            is_quick_retail: true,
            is_restaurant_item: true,
            no_receipt_default: true,
            age_restricted: true,
            requires_age_confirmation: true,
            track_stock: true,
            stock_qty: 200,
            unit_type: 'stick'
        },
        {
            name: 'Cigarette Dunhill - Single Stick',
            category: 'Restricted Retail',
            main_category: 'Retail',
            price: 160,
            item_type: 'Restricted Retail',
            send_to_kitchen: false,
            is_quick_retail: true,
            is_restaurant_item: true,
            no_receipt_default: true,
            age_restricted: true,
            requires_age_confirmation: true,
            track_stock: true,
            stock_qty: 200,
            unit_type: 'stick'
        },
        {
            name: 'Lighter',
            category: 'Restricted Retail',
            main_category: 'Retail',
            price: 50,
            item_type: 'Retail',
            send_to_kitchen: false,
            is_quick_retail: true,
            is_restaurant_item: true,
            no_receipt_default: true,
            track_stock: true,
            stock_qty: 50,
            unit_type: 'piece'
        },
        
        // 2. Beverages
        {
            name: 'Water Bottle 500ml',
            category: 'Beverages',
            main_category: 'Retail',
            price: 80,
            item_type: 'Beverage',
            send_to_kitchen: false,
            is_quick_retail: true,
            is_restaurant_item: true,
            no_receipt_default: true,
            track_stock: true,
            stock_qty: 48,
            unit_type: 'bottle'
        },
        {
            name: 'Water Bottle 1L',
            category: 'Beverages',
            main_category: 'Retail',
            price: 120,
            item_type: 'Beverage',
            send_to_kitchen: false,
            is_quick_retail: true,
            is_restaurant_item: true,
            no_receipt_default: true,
            track_stock: true,
            stock_qty: 24,
            unit_type: 'bottle'
        },
        {
            name: 'Coke Bottle 500ml',
            category: 'Beverages',
            main_category: 'Retail',
            price: 150,
            item_type: 'Beverage',
            send_to_kitchen: false,
            is_quick_retail: true,
            is_restaurant_item: true,
            no_receipt_default: true,
            track_stock: true,
            stock_qty: 24,
            unit_type: 'bottle'
        },
        
        // 3. Snacks
        {
            name: 'Biscuit Packet (Small)',
            category: 'Snacks',
            main_category: 'Retail',
            price: 60,
            item_type: 'Retail',
            send_to_kitchen: false,
            is_quick_retail: true,
            is_restaurant_item: true,
            no_receipt_default: true,
            track_stock: true,
            stock_qty: 20,
            unit_type: 'packet'
        },
        {
            name: 'Snack Packet (Mixture)',
            category: 'Snacks',
            main_category: 'Retail',
            price: 100,
            item_type: 'Retail',
            send_to_kitchen: false,
            is_quick_retail: true,
            is_restaurant_item: true,
            no_receipt_default: true,
            track_stock: true,
            stock_qty: 30,
            unit_type: 'packet'
        },
        {
            name: 'Chocolate Bar',
            category: 'Snacks',
            main_category: 'Retail',
            price: 120,
            item_type: 'Retail',
            send_to_kitchen: false,
            is_quick_retail: true,
            is_restaurant_item: true,
            no_receipt_default: true,
            track_stock: true,
            stock_qty: 15,
            unit_type: 'piece'
        },
        {
            name: 'Chewing Gum',
            category: 'Snacks',
            main_category: 'Retail',
            price: 10,
            item_type: 'Retail',
            send_to_kitchen: false,
            is_quick_retail: true,
            is_restaurant_item: true,
            no_receipt_default: true,
            track_stock: true,
            stock_qty: 100,
            unit_type: 'piece'
        },
        
        // 4. Small Retail
        {
            name: 'Tissue Pack',
            category: 'Small Retail',
            main_category: 'Retail',
            price: 150,
            item_type: 'Retail',
            send_to_kitchen: false,
            is_quick_retail: true,
            is_restaurant_item: true,
            no_receipt_default: true,
            track_stock: true,
            stock_qty: 20,
            unit_type: 'pack'
        },
        {
            name: 'Shopping Bag',
            category: 'Small Retail',
            main_category: 'Retail',
            price: 10,
            item_type: 'Retail',
            send_to_kitchen: false,
            is_quick_retail: true,
            is_restaurant_item: true,
            no_receipt_default: true,
            track_stock: true,
            stock_qty: 500,
            unit_type: 'piece'
        },
        
        // 5. Packing / Extras
        {
            name: 'Extra Sauce Packet',
            category: 'Packing / Extras',
            main_category: 'Retail',
            price: 20,
            item_type: 'Retail',
            send_to_kitchen: false,
            is_quick_retail: true,
            is_restaurant_item: true,
            no_receipt_default: true,
            track_stock: false,
            unit_type: 'packet'
        }
    ];

    try {
        for (const item of itemsToSeed) {
            console.log(`Seeding item: ${item.name}`);
            
            await db.query(
                `INSERT INTO items (
                    name, category, main_category, price, item_type, 
                    send_to_kitchen, is_quick_retail, is_restaurant_item, 
                    no_receipt_default, age_restricted, requires_age_confirmation, 
                    track_stock, stock_qty, unit_type, status, availability_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'available')
                ON DUPLICATE KEY UPDATE 
                    price = VALUES(price),
                    is_quick_retail = VALUES(is_quick_retail),
                    is_restaurant_item = VALUES(is_restaurant_item),
                    no_receipt_default = VALUES(no_receipt_default)`,
                [
                    item.name, item.category, item.main_category, item.price, item.item_type,
                    item.send_to_kitchen ? 1 : 0, item.is_quick_retail ? 1 : 0, item.is_restaurant_item ? 1 : 0,
                    item.no_receipt_default ? 1 : 0, item.age_restricted ? 1 : 0, item.requires_age_confirmation ? 1 : 0,
                    item.track_stock ? 1 : 0, item.stock_qty || 0, item.unit_type
                ]
            );
        }
        
        console.log('Quick Retail Seeding Successful!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding Failed:', error);
        process.exit(1);
    }
}

seedQuickRetailItems();
