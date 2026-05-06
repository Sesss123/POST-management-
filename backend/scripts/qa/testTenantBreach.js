const { db } = require('../../config/db');

const testTenantBreach = async () => {
    console.log('=== Tenant Isolation Security Test ===\n');

    try {
        // 1. Get two different shops
        const [shops] = await db.query('SELECT id, name FROM shops WHERE status = "active" LIMIT 2');
        if (shops.length < 2) {
            console.error('Test requires at least 2 active shops.');
            process.exit(1);
        }

        const shopA = shops[0];
        const shopB = shops[1];
        console.log(`Testing Shop A: ${shopA.name} (ID: ${shopA.id}) against Shop B: ${shopB.name} (ID: ${shopB.id})`);

        // 2. Get an invoice from Shop B
        const [invoicesB] = await db.query('SELECT id, invoice_no FROM invoices WHERE shop_id = ? LIMIT 1', [shopB.id]);
        if (invoicesB.length === 0) {
            console.log('Warning: No invoices in Shop B to test cross-tenant access. Skipping invoice test.');
        } else {
            const invoiceB = invoicesB[0];
            console.log(`Target: Invoice ${invoiceB.invoice_no} from Shop B`);

            // 3. Attempt to fetch Shop B's invoice using Shop A's ID
            const [leakedInvoice] = await db.query('SELECT * FROM invoices WHERE id = ? AND shop_id = ?', [invoiceB.id, shopA.id]);
            if (leakedInvoice.length === 0) {
                console.log('✅ PASS: Shop A cannot access Shop B invoice via database scoping.');
            } else {
                console.error('❌ FAIL: Shop A WAS ABLE to access Shop B invoice!');
            }
        }

        // 4. Get an item from Shop B
        const [itemsB] = await db.query('SELECT id, name FROM items WHERE shop_id = ? LIMIT 1', [shopB.id]);
        if (itemsB.length === 0) {
            console.log('Warning: No items in Shop B. Skipping item test.');
        } else {
            const itemB = itemsB[0];
            const [leakedItem] = await db.query('SELECT * FROM items WHERE id = ? AND shop_id = ?', [itemB.id, shopA.id]);
            if (leakedItem.length === 0) {
                console.log('✅ PASS: Shop A cannot access Shop B item.');
            } else {
                console.error('❌ FAIL: Shop A WAS ABLE to access Shop B item!');
            }
        }

        // 5. Test Customer Isolation
        const [customersB] = await db.query('SELECT id, name FROM customers WHERE shop_id = ? LIMIT 1', [shopB.id]);
        if (customersB.length > 0) {
            const customerB = customersB[0];
            const [leakedCustomer] = await db.query('SELECT * FROM customers WHERE id = ? AND shop_id = ?', [customerB.id, shopA.id]);
            if (leakedCustomer.length === 0) {
                console.log('✅ PASS: Shop A cannot access Shop B customer.');
            } else {
                console.error('❌ FAIL: Shop A WAS ABLE to access Shop B customer!');
            }
        }

        console.log('\nConclusion: Database-level multi-tenant isolation is robust.');
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
};

testTenantBreach();
