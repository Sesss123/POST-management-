const { db } = require('../config/db');

const tablesToCheck = [
    'users', 'items', 'customers', 'invoices', 'invoice_items', 'payments', 
    'customer_ledger', 'restaurant_tables', 'table_sessions', 'order_items', 
    'kot_orders', 'kot_items', 'held_bills', 'held_bill_items', 'settings', 
    'audit_logs', 'suppliers', 'purchases', 'purchase_items', 'supplier_payments', 
    'supplier_ledger', 'stock_movements', 'retail_stock_receipts', 'payment_transactions',
    'support_tickets', 'support_replies'
];

const audit = async () => {
    console.log('=== RestoLedger Multi-Tenant Isolation Audit ===\n');
    const report = [];

    try {
        for (const table of tablesToCheck) {
            // 1. Check if table exists
            const [tableExists] = await db.query(
                "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?", 
                [table]
            );

            if (tableExists[0].count === 0) {
                report.push({ table, status: 'SKIPPED', issue: 'Table does not exist' });
                continue;
            }

            // 2. Check shop_id column
            const [columns] = await db.query(
                "SELECT COLUMN_NAME, IS_NULLABLE FROM information_schema.columns WHERE table_name = ? AND column_name = 'shop_id' AND table_schema = DATABASE()", 
                [table]
            );

            if (columns.length === 0) {
                report.push({ table, status: 'FAIL', issue: 'Missing shop_id column' });
                continue;
            }

            const isNullable = columns[0].IS_NULLABLE === 'YES';

            // 3. Check for NULL or 0 shop_id
            const [orphans] = await db.query(`SELECT COUNT(*) as count FROM \`${table}\` WHERE shop_id IS NULL OR shop_id = 0`);
            const orphanCount = orphans[0].count;

            // 4. Check for index on shop_id
            const [indexes] = await db.query("SHOW INDEX FROM ?? WHERE Column_name = 'shop_id'", [table]);
            const hasIndex = indexes.length > 0;

            if (isNullable || orphanCount > 0 || !hasIndex) {
                let issues = [];
                if (isNullable) issues.push('shop_id is nullable');
                if (orphanCount > 0) issues.push(`${orphanCount} orphaned rows (NULL/0)`);
                if (!hasIndex) issues.push('Missing index on shop_id');
                
                report.push({ table, status: 'WARNING', issue: issues.join(', ') });
            } else {
                report.push({ table, status: 'PASS', issue: 'OK' });
            }
        }

        // Print Report
        console.table(report);

        const fails = report.filter(r => r.status === 'FAIL');
        const warnings = report.filter(r => r.status === 'WARNING');

        console.log(`\nAudit Summary:`);
        console.log(`- Total Tables Checked: ${tablesToCheck.length}`);
        console.log(`- PASS: ${report.filter(r => r.status === 'PASS').length}`);
        console.log(`- FAIL: ${fails.length}`);
        console.log(`- WARNING: ${warnings.length}`);
        console.log(`- SKIPPED: ${report.filter(r => r.status === 'SKIPPED').length}`);

        if (fails.length > 0 || warnings.length > 0) {
            console.log('\nAction Required: Run 040_tenant_isolation_completion.sql migration.');
        } else {
            console.log('\nAll checked tables are properly isolated.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Audit failed:', error);
        process.exit(1);
    }
};

audit();
