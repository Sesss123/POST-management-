const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Try to find .env in current dir or backend dir
const envPath = fs.existsSync('.env') ? '.env' : (fs.existsSync('backend/.env') ? 'backend/.env' : null);
if (envPath) {
    require('dotenv').config({ path: envPath });
}

async function runAudit() {
    console.log('==================================================');
    console.log('PART 1: DATABASE CONNECTION CHECK');
    console.log('==================================================');

    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'restoledgerdb',
        multipleStatements: true
    };

    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log('Connection: SUCCESS');
        console.log(`Database: ${config.database}`);

        const [tables] = await connection.query('SHOW TABLES');
        const existingTables = tables.map(t => Object.values(t)[0]);
        console.log(`Total Table Count: ${tables.length}`);

        console.log('\n==================================================');
        console.log('PART 3: COLUMN STRUCTURE CHECK');
        console.log('==================================================');
        const importantTables = ['users', 'items', 'invoices', 'invoice_items', 'customers', 'customer_ledger', 'payments', 'payment_allocations', 'held_bills', 'kot_orders', 'audit_logs', 'settings'];
        for (const table of importantTables) {
            if (existingTables.includes(table)) {
                const [columns] = await connection.query(`SHOW COLUMNS FROM ${table}`);
                console.log(`${table}: ${columns.length} columns`);
            }
        }

        console.log('\n==================================================');
        console.log('PART 5: SETTINGS CHECK');
        console.log('==================================================');
        const requiredSettings = [
            'restaurant_name', 'tax_enabled', 'naya_book_enabled', 'held_bills_enabled', 'quick_retail_enabled', 'stock_tracking_enabled', 'session_timeout_minutes'
        ];
        const [settings] = await connection.query('SELECT setting_key, setting_value FROM settings');
        const settingKeys = settings.map(s => s.setting_key);
        for (const key of requiredSettings) {
            console.log(`${key.padEnd(30)}: ${settingKeys.includes(key) ? 'YES' : 'NO'}`);
        }

        console.log('\n==================================================');
        console.log('PART 9: HELD BILLS CHECK');
        console.log('==================================================');
        const [heldStatusCheck] = await connection.query("SELECT id, hold_no, status FROM held_bills WHERE status NOT IN ('held', 'resumed', 'completed', 'cancelled')");
        console.log(`Invalid Status Held Bills: ${heldStatusCheck.length}`);
        
        const [completedNoInv] = await connection.query("SELECT hold_no FROM held_bills WHERE status = 'completed' AND invoice_id IS NULL");
        console.log(`Completed Held Bills with No Invoice ID: ${completedNoInv.length}`);

        console.log('\n==================================================');
        console.log('PART 10: KOT / KITCHEN CHECK');
        console.log('==================================================');
        const [kotStatusCheck] = await connection.query("SELECT id, kot_no, status FROM kot_orders WHERE status NOT IN ('pending', 'preparing', 'ready', 'served', 'cancelled')");
        console.log(`Invalid Status KOTs: ${kotStatusCheck.length}`);

        const [kotNoItems] = await connection.query('SELECT kot_no FROM kot_orders WHERE id NOT IN (SELECT DISTINCT kot_id FROM kot_items)');
        console.log(`KOTs with No Items: ${kotNoItems.length}`);

        console.log('\n==================================================');
        console.log('PART 14: SECURITY / AUDIT CHECK');
        console.log('==================================================');
        const [[{ logCount }]] = await connection.query('SELECT COUNT(*) as count FROM audit_logs');
        console.log(`Total Audit Logs: ${logCount}`);
        
        const [recentLogs] = await connection.query('SELECT action, entity_type, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 5');
        console.log('Recent 5 logs:');
        recentLogs.forEach(l => console.log(` - ${l.action} on ${l.entity_type} at ${l.created_at}`));

        console.log('\n==================================================');
        console.log('PART 16: INDEX CHECK');
        console.log('==================================================');
        const [indexes] = await connection.query(`
            SELECT TABLE_NAME, INDEX_NAME 
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = '${config.database}'
        `);
        console.log(`Total Indexes: ${indexes.length}`);

        const requiredTables = [
            'users', 'items', 'customers', 'restaurant_tables', 'invoices', 'invoice_items', 'payments', 
            'customer_ledger', 'settings', 'audit_logs', 'table_sessions', 'order_items', 'kot_orders', 
            'kot_items', 'held_bills', 'held_bill_items', 'payment_allocations', 'stock_movements', 
            'retail_stock_receipts', 'suppliers', 'purchases', 'purchase_items', 'supplier_payments', 
            'supplier_ledger', 'supplier_payment_allocations', 'shifts', 'cash_movements', 
            'item_modifiers', 'order_item_modifiers', 'invoice_item_modifiers', 'held_bill_item_modifiers'
        ];
        for (const table of requiredTables) {
            const exists = existingTables.includes(table);
            let rowCount = 0;
            if (exists) {
                const [[{ count }]] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
                rowCount = count;
            }
            console.log(`${table.padEnd(30)}: ${exists ? 'YES' : 'NO'} (Rows: ${rowCount})`);
        }

        console.log('\n==================================================');
        console.log('PART 4: ROLE DATA CHECK');
        console.log('==================================================');
        const [users] = await connection.query('SELECT id, name, email, role, status FROM users');
        const allowedRoles = ['admin', 'cashier', 'kitchen'];
        let invalidRoles = users.filter(u => !allowedRoles.includes(u.role));
        let admins = users.filter(u => u.role === 'admin' && u.status === 'active');
        let duplicateEmails = await connection.query('SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1');

        console.log(`Invalid Roles Found: ${invalidRoles.length}`);
        invalidRoles.forEach(u => console.log(` - User ID ${u.id}: ${u.role}`));
        console.log(`Active Admins: ${admins.length}`);
        if (admins.length === 0) console.log('WARNING: No active admin found!');
        console.log(`Duplicate Emails: ${duplicateEmails[0].length}`);

        console.log('\n==================================================');
        console.log('PART 6: INVOICE DATA INTEGRITY');
        console.log('==================================================');
        const [duplicates] = await connection.query('SELECT invoice_no, COUNT(*) as count FROM invoices GROUP BY invoice_no HAVING count > 1');
        console.log(`Duplicate Invoice Nos: ${duplicates.length}`);

        const [invalidTotals] = await connection.query(`
            SELECT id, invoice_no, grand_total, paid_amount, balance_amount 
            FROM invoices 
            WHERE grand_total < 0 OR paid_amount < 0 OR balance_amount < 0
            OR (payment_status != 'cancelled' AND ABS(paid_amount + balance_amount - grand_total) > 0.01)
        `);
        console.log(`Invalid Totals/Balances: ${invalidTotals.length}`);
        invalidTotals.forEach(i => console.log(` - INV ${i.invoice_no} (ID: ${i.id}): GT=${i.grand_total}, Paid=${i.paid_amount}, Bal=${i.balance_amount}`));

        const [paidWithBalance] = await connection.query("SELECT id, invoice_no FROM invoices WHERE payment_status = 'paid' AND balance_amount > 0");
        console.log(`Paid with Balance: ${paidWithBalance.length}`);

        const [unpaidWithPaid] = await connection.query("SELECT id, invoice_no FROM invoices WHERE payment_status = 'unpaid' AND paid_amount > 0");
        console.log(`Unpaid with Paid Amount: ${unpaidWithPaid.length}`);

        console.log('\n==================================================');
        console.log('PART 7: NAYA BOOK CONSISTENCY CHECK');
        console.log('==================================================');
        const [customerIntegrity] = await connection.query(`
            SELECT c.id, c.name, c.current_balance, 
                   IFNULL((SELECT SUM(balance_amount) FROM invoices WHERE customer_id = c.id AND payment_status IN ('unpaid', 'partial') AND balance_amount > 0), 0) as calculated_balance
            FROM customers c
        `);
        
        let nayaMismatches = 0;
        customerIntegrity.forEach(c => {
            const diff = Math.abs(c.current_balance - c.calculated_balance);
            if (diff > 0.01) {
                nayaMismatches++;
                console.log(`MISMATCH - Customer ${c.id} (${c.name}): DB=${c.current_balance}, Calculated=${c.calculated_balance}, Diff=${c.current_balance - c.calculated_balance}`);
            }
        });
        console.log(`Total Naya Mismatches: ${nayaMismatches}`);

        console.log('\n==================================================');
        console.log('PART 8: PAYMENT ALLOCATION CHECK');
        console.log('==================================================');
        const [orphanPayments] = await connection.query('SELECT id FROM payments WHERE customer_id NOT IN (SELECT id FROM customers)');
        console.log(`Orphan Payments (No Customer): ${orphanPayments.length}`);

        const [allocMismatches] = await connection.query(`
            SELECT p.id, p.amount, SUM(pa.allocated_amount) as total_allocated
            FROM payments p
            JOIN payment_allocations pa ON p.id = pa.payment_id
            GROUP BY p.id
            HAVING ABS(total_allocated - p.amount) > 0.01
        `);
        console.log(`Payment Allocation Mismatches: ${allocMismatches.length}`);

        console.log('\n==================================================');
        console.log('PART 11: STOCK CHECK');
        console.log('==================================================');
        const [negativeStock] = await connection.query('SELECT id, name, stock_qty FROM items WHERE track_stock = 1 AND stock_qty < 0');
        console.log(`Negative Stock Items: ${negativeStock.length}`);
        negativeStock.forEach(i => console.log(` - ${i.name}: ${i.stock_qty}`));

        const [soldOutMismatch] = await connection.query("SELECT id, name FROM items WHERE track_stock = 1 AND stock_qty = 0 AND availability_status != 'sold_out'");
        console.log(`Sold-out Status Mismatches: ${soldOutMismatch.length}`);

        console.log('\n==================================================');
        console.log('PART 15: FOREIGN KEY / ORPHAN RECORD CHECK');
        console.log('==================================================');
        const queries = {
            'invoice_items -> invoices': 'SELECT COUNT(*) as count FROM invoice_items WHERE invoice_id NOT IN (SELECT id FROM invoices)',
            'payments -> customers': 'SELECT COUNT(*) as count FROM payments WHERE customer_id NOT IN (SELECT id FROM customers)',
            'customer_ledger -> customers': 'SELECT COUNT(*) as count FROM customer_ledger WHERE customer_id NOT IN (SELECT id FROM customers)',
            'kot_items -> kot_orders': 'SELECT COUNT(*) as count FROM kot_items WHERE kot_id NOT IN (SELECT id FROM kot_orders)',
            'held_bill_items -> held_bills': 'SELECT COUNT(*) as count FROM held_bill_items WHERE held_bill_id NOT IN (SELECT id FROM held_bills)'
        };

        for (const [name, query] of Object.entries(queries)) {
            const [[{ count }]] = await connection.query(query);
            console.log(`${name.padEnd(30)}: ${count} orphans`);
        }

    } catch (err) {
        console.error('Audit Error:', err);
    } finally {
        if (connection) await connection.end();
    }
}

runAudit();
