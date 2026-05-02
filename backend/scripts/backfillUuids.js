const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'backend/.env' });

const tables = [
    'users', 'items', 'customers', 'invoices', 'invoice_items', 'payments', 'customer_ledger', 'settings', 'audit_logs',
    'restaurant_tables', 'table_sessions', 'order_items', 'kot_orders', 'kot_items', 'held_bills', 'held_bill_items',
    'stock_movements', 'retail_stock_receipts',
    'suppliers', 'purchases', 'purchase_items', 'supplier_payments', 'supplier_ledger', 'supplier_payment_allocations',
    'shifts', 'cash_movements', 'item_modifiers', 'order_item_modifiers', 'invoice_item_modifiers', 'held_bill_item_modifiers', 'payment_allocations'
];

async function runMigration() {
    console.log('==================================================');
    console.log('RestoLedger POS - UUID Migration & Backfill');
    console.log('==================================================');

    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    };

    const connection = await mysql.createConnection(config);

    try {
        for (const table of tables) {
            process.stdout.write(`Processing ${table.padEnd(30)}... `);

            // 1. Check if table exists
            const [tableExists] = await connection.query(`SHOW TABLES LIKE '${table}'`);
            if (tableExists.length === 0) {
                console.log('SKIPPED (Table missing)');
                continue;
            }

            // 2. Add column if missing
            const [columns] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE 'uuid'`);
            if (columns.length === 0) {
                await connection.query(`ALTER TABLE ${table} ADD COLUMN uuid CHAR(36) NULL AFTER id`);
            }

            // 3. Backfill null values
            // We use a loop or batch update to ensure uniqueness if needed, but MySQL UUID() is fine for backfill
            const [result] = await connection.query(`UPDATE ${table} SET uuid = UUID() WHERE uuid IS NULL OR uuid = ''`);
            const backfilledCount = result.changedRows;

            // 4. Add Unique Index if missing
            const [indexes] = await connection.query(`SHOW INDEX FROM ${table} WHERE Key_name = 'idx_${table}_uuid'`);
            if (indexes.length === 0) {
                await connection.query(`CREATE UNIQUE INDEX idx_${table}_uuid ON ${table}(uuid)`);
            }

            console.log(`DONE (Backfilled: ${backfilledCount})`);
        }

        console.log('\n==================================================');
        console.log('MIGRATION COMPLETED SUCCESSFULLY');
        console.log('==================================================');

        // Log completion
        await connection.query(
            "INSERT INTO audit_logs (user_id, action, entity_type, old_value) VALUES (1, 'uuid_backfill_completed', 'system', ?)",
            [JSON.stringify({ tables_processed: tables.length })]
        );

    } catch (err) {
        console.error('\nMIGRATION FAILED');
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

runMigration();
