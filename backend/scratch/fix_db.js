const { db } = require('../config/db');

async function fixDatabase() {
    console.log('Starting database fix...');
    try {
        const columnsToAdd = [
            { name: 'currency_code', type: 'VARCHAR(10) DEFAULT "LKR"' },
            { name: 'currency_symbol', type: 'VARCHAR(10) DEFAULT "Rs."' },
            { name: 'tax_name', type: 'VARCHAR(20) DEFAULT "Tax"' },
            { name: 'tax_inclusive', type: 'TINYINT(1) DEFAULT 0' },
            { name: 'receipt_restaurant_name', type: 'VARCHAR(100)' },
            { name: 'receipt_restaurant_phone', type: 'VARCHAR(20)' },
            { name: 'receipt_restaurant_address', type: 'TEXT' },
            { name: 'receipt_footer_message', type: 'TEXT' },
            { name: 'receipt_logo_url', type: 'TEXT' },
            { name: 'loyalty_points_redeemed', type: 'DECIMAL(10,2) DEFAULT 0' },
            { name: 'loyalty_discount_amount', type: 'DECIMAL(10,2) DEFAULT 0' },
            { name: 'sale_channel', type: 'VARCHAR(20) DEFAULT "normal"' },
            { name: 'no_receipt', type: 'TINYINT(1) DEFAULT 0' },
            { name: 'sale_type', type: 'VARCHAR(20) DEFAULT "restaurant"' }
        ];

        for (const col of columnsToAdd) {
            try {
                await db.query(`ALTER TABLE invoices ADD COLUMN ${col.name} ${col.type}`);
                console.log(`Added column to invoices: ${col.name}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column already exists in invoices: ${col.name}`);
                } else {
                    console.error(`Error adding column ${col.name} to invoices:`, err.message);
                }
            }
        }

        const kotColumnsToAdd = [
            { name: 'invoice_id', type: 'INT' },
            { name: 'order_type', type: 'VARCHAR(20) DEFAULT "dine_in"' },
            { name: 'waiter_id', type: 'INT' }
        ];

        for (const col of kotColumnsToAdd) {
            try {
                await db.query(`ALTER TABLE kot_orders ADD COLUMN ${col.name} ${col.type}`);
                console.log(`Added column to kot_orders: ${col.name}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column already exists in kot_orders: ${col.name}`);
                } else {
                    console.error(`Error adding column ${col.name} to kot_orders:`, err.message);
                }
            }
        }

        const stockColumnsToAdd = [
            { name: 'balance_after', type: 'DECIMAL(10,2) DEFAULT 0' }
        ];

        for (const col of stockColumnsToAdd) {
            try {
                await db.query(`ALTER TABLE stock_movements ADD COLUMN ${col.name} ${col.type}`);
                console.log(`Added column to stock_movements: ${col.name}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column already exists in stock_movements: ${col.name}`);
                } else {
                    console.error(`Error adding column ${col.name} to stock_movements:`, err.message);
                }
            }
        }

        console.log('Database fix completed.');
        process.exit(0);
    } catch (error) {
        console.error('Database fix failed:', error);
        process.exit(1);
    }
}

fixDatabase();
