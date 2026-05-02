
const { db } = require('../backend/config/db');

async function auditDatabase() {
    try {
        const [tables] = await db.query('SHOW TABLES');
        const tableList = tables.map(t => Object.values(t)[0]);
        
        const requiredTables = [
            'users', 'items', 'customers', 'restaurant_tables', 'invoices', 'invoice_items', 'payments', 
            'customer_ledger', 'settings', 'audit_logs', 'table_sessions', 'order_items', 'kot_orders', 
            'kot_items', 'held_bills', 'held_bill_items', 'payment_allocations', 'stock_movements', 
            'retail_stock_receipts', 'suppliers', 'purchases', 'purchase_items', 'supplier_payments', 
            'supplier_ledger', 'supplier_payment_allocations', 'shifts', 'cash_movements', 
            'item_modifiers', 'order_item_modifiers', 'invoice_item_modifiers', 'held_bill_item_modifiers'
        ];

        console.log('\n--- UUID COLUMN CHECK ---');
        for (const table of requiredTables) {
            if (tableList.includes(table)) {
                const [columns] = await db.query(`SHOW COLUMNS FROM ${table} LIKE 'uuid'`);
                if (columns.length === 0) {
                    console.log(`[FAIL] ${table}: uuid MISSING`);
                } else {
                    console.log(`[PASS] ${table}: uuid EXISTS`);
                }
            } else {
                 console.log(`[FAIL] ${table}: TABLE MISSING`);
            }
        }

        console.log('\n--- ROLE CHECK ---');
        const [roles] = await db.query('SELECT DISTINCT role FROM users');
        console.log('Registered roles:', roles.map(r => r.role).join(', '));
        const validRoles = ['admin', 'cashier', 'kitchen'];
        const invalidRoles = roles.filter(r => !validRoles.includes(r.role));
        if (invalidRoles.length > 0) {
            console.log('[WARNING] Invalid roles found:', invalidRoles.map(r => r.role).join(', '));
        } else {
            console.log('[PASS] All roles are valid.');
        }

        console.log('\n--- SETTINGS CHECK ---');
        const [settings] = await db.query('SELECT COUNT(*) as count FROM settings');
        console.log(`Settings count: ${settings[0].count}`);

    } catch (error) {
        console.error('Audit failed:', error);
    } finally {
        process.exit();
    }
}

auditDatabase();
