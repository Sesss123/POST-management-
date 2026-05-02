
const { db } = require('../backend/config/db');

async function auditDatabase() {
    try {
        const [tables] = await db.query('SHOW TABLES');
        const tableList = tables.map(t => Object.values(t)[0]);
        console.log('--- TABLES ---');
        console.log(tableList.join(', '));

        const requiredTables = [
            'users', 'items', 'customers', 'restaurant_tables', 'invoices', 'invoice_items', 'payments', 
            'customer_ledger', 'settings', 'audit_logs', 'table_sessions', 'order_items', 'kot_orders', 
            'kot_items', 'held_bills', 'held_bill_items', 'payment_allocations', 'stock_movements', 
            'retail_stock_receipts', 'suppliers', 'purchases', 'purchase_items', 'supplier_payments', 
            'supplier_ledger', 'supplier_payment_allocations', 'shifts', 'cash_movements', 
            'item_modifiers', 'order_item_modifiers', 'invoice_item_modifiers', 'held_bill_item_modifiers'
        ];

        console.log('\n--- MISSING TABLES ---');
        const missing = requiredTables.filter(t => !tableList.includes(t));
        console.log(missing.length > 0 ? missing.join(', ') : 'None');

        console.log('\n--- UUID COLUMN CHECK ---');
        for (const table of requiredTables) {
            if (tableList.includes(table)) {
                const [columns] = await db.query(`SHOW COLUMNS FROM ${table} LIKE 'uuid'`);
                if (columns.length === 0) {
                    console.log(`Table ${table} is MISSING uuid column`);
                }
            }
        }

        console.log('\n--- DATA INTEGRITY CHECKS ---');
        // Invoice balance mismatch
        const [invMismatch] = await db.query('SELECT id, invoice_no FROM invoices WHERE ABS(grand_total - paid_amount - balance_amount) > 0.01');
        console.log(`Invoice balance mismatches: ${invMismatch.length}`);
        if (invMismatch.length > 0) console.log(JSON.stringify(invMismatch));

        // Naya balance mismatch
        const [nayaMismatch] = await db.query(`
            SELECT c.id, c.name, c.current_balance, SUM(i.balance_amount) as calculated_balance
            FROM customers c
            JOIN invoices i ON c.id = i.customer_id
            WHERE i.payment_status != 'cancelled'
            GROUP BY c.id
            HAVING ABS(c.current_balance - calculated_balance) > 0.01
        `);
        console.log(`Naya balance mismatches: ${nayaMismatch.length}`);
        if (nayaMismatch.length > 0) console.log(JSON.stringify(nayaMismatch));

        // Empty KOTs
        const [emptyKots] = await db.query('SELECT id FROM kot_orders WHERE id NOT IN (SELECT kot_id FROM kot_items)');
        console.log(`Empty KOTs: ${emptyKots.length}`);

        // Orphan invoice items
        const [orphanInvItems] = await db.query('SELECT id FROM invoice_items WHERE invoice_id NOT IN (SELECT id FROM invoices)');
        console.log(`Orphan invoice items: ${orphanInvItems.length}`);

    } catch (error) {
        console.error('Audit failed:', error);
    } finally {
        process.exit();
    }
}

auditDatabase();
