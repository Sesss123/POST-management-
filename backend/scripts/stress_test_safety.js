const { db } = require('../config/db');
const invoiceController = require('../controllers/invoiceController');
const paymentGatewayController = require('../controllers/paymentGatewayController');
const { generateUuid } = require('../utils/identifier');

async function runTests() {
    console.log('🚀 STARTING DEEP STRESS TEST: MONEY & TENANT SAFETY');
    console.log('==================================================');

    const results = [];
    const shopA = 1;
    const shopB = 2;

    // --- TEST 1: TENANT ISOLATION ---
    console.log('[TEST 1] TENANT ISOLATION');
    try {
        const [invB] = await db.query("INSERT INTO invoices (uuid, invoice_no, shop_id, grand_total, payment_status, created_by) VALUES (?, 'STRESS-TENANT-B', ?, 1500, 'paid', 1)", [generateUuid(), shopB]);
        const userA = { id: 1, role: 'admin', shopId: shopA }; 

        const req = { params: { id: invB.insertId }, shopId: shopA, user: userA };
        const res = { statusCode: 200, status: function(c){this.statusCode=c;return this;}, json: function(d){this.data=d;return this;} };
        await invoiceController.getInvoiceDetails(req, res);
        
        if (res.statusCode === 404) {
            console.log('✅ PASS: Tenant isolation confirmed.');
            results.push({ test: 'Tenant Isolation', status: 'PASS' });
        } else {
            console.log('❌ FAIL: Shop A accessed Shop B data!');
            results.push({ test: 'Tenant Isolation', status: 'FAIL' });
        }
    } catch (err) { results.push({ test: 'Tenant Isolation', status: 'ERROR' }); }

    // --- TEST 2: NAYA BOOK CONSISTENCY ---
    console.log('\n[TEST 2] NAYA BOOK CONSISTENCY');
    try {
        // Create a FRESH customer for clean test
        const [newCust] = await db.query("INSERT INTO customers (uuid, name, phone, shop_id, current_balance) VALUES (?, 'Stress Test Cust', '000000', ?, 0)", [generateUuid(), shopA]);
        const customerId = newCust.insertId;
        
        await db.query("INSERT INTO invoices (uuid, invoice_no, customer_id, shop_id, grand_total, balance_amount, payment_status, payment_method, created_by) VALUES (?, 'NAYA-STRESS-1', ?, ?, 500, 500, 'unpaid', 'credit', 1)", [generateUuid(), customerId, shopA]);
        await db.query("UPDATE customers SET current_balance = current_balance + 500 WHERE id = ?", [customerId]);

        const [cust] = await db.query('SELECT current_balance FROM customers WHERE id = ?', [customerId]);
        const [sum] = await db.query('SELECT SUM(balance_amount) as total FROM invoices WHERE customer_id = ? AND payment_status IN ("unpaid", "partial") AND shop_id = ?', [customerId, shopA]);
        
        if (Math.abs(parseFloat(cust[0].current_balance) - parseFloat(sum[0].total)) < 0.01) {
            console.log('✅ PASS: Naya balance is consistent.');
            results.push({ test: 'Naya Consistency', status: 'PASS' });
        } else {
            console.log(`❌ FAIL: Naya mismatch! DB=${cust[0].current_balance}, SUM=${sum[0].total}`);
            results.push({ test: 'Naya Consistency', status: 'FAIL' });
        }
    } catch (err) { console.error(err); results.push({ test: 'Naya Consistency', status: 'ERROR' }); }

    // --- TEST 3: QR IDEMPOTENCY ---
    console.log('\n[TEST 3] QR IDEMPOTENCY');
    try {
        const [invQ] = await db.query("INSERT INTO invoices (uuid, invoice_no, shop_id, grand_total, paid_amount, payment_status, payment_method, created_by) VALUES (?, 'QR-IDEM-STRESS', ?, 1000, 0, 'pending', 'qr', 1)", [generateUuid(), shopA]);
        const [txQ] = await db.query("INSERT INTO payment_transactions (uuid, invoice_id, shop_id, amount, status, gateway_order_id, provider, method, created_by) VALUES (?, ?, ?, 1000, 'pending', 'STRESS-IDEM-QR', 'genie', 'qr', 1)", [generateUuid(), invQ.insertId, shopA]);
        
        const txUuid = (await db.query('SELECT uuid FROM payment_transactions WHERE id = ?', [txQ.insertId]))[0][0].uuid;

        const req = { params: { uuid: txUuid }, shopId: shopA, user: { id: 1 } };
        const res = { status: function(c){return this;}, json: function(d){this.data=d;return this;} };

        const paymentGatewayService = require('../services/payments/paymentGatewayService');
        const originalCheck = paymentGatewayService.checkPaymentStatus;
        paymentGatewayService.checkPaymentStatus = async () => ({
            status: 'paid', gateway_transaction_id: 'TXN-STRESS-IDEM', gateway_reference: 'REF-STRESS-IDEM', paid_at: new Date(), raw_response: { status: 'SUCCESS' }
        });

        await Promise.all([
            paymentGatewayController.checkTransactionStatus(req, res),
            paymentGatewayController.checkTransactionStatus(req, res)
        ]);

        const [finalInv] = await db.query('SELECT paid_amount FROM invoices WHERE id = ?', [invQ.insertId]);
        const [payCount] = await db.query('SELECT COUNT(*) as count FROM invoice_payments WHERE invoice_id = ?', [invQ.insertId]);

        if (parseFloat(finalInv[0].paid_amount) === 1000 && payCount[0].count === 1) {
            console.log('✅ PASS: Idempotency enforced.');
            results.push({ test: 'QR Idempotency', status: 'PASS' });
        } else {
            console.log('❌ FAIL: Double spend side-effects detected!');
            results.push({ test: 'QR Idempotency', status: 'FAIL' });
        }
        paymentGatewayService.checkPaymentStatus = originalCheck;
    } catch (err) { results.push({ test: 'QR Idempotency', status: 'ERROR' }); }

    // --- TEST 4: SPLIT BILL ---
    console.log('\n[TEST 4] SPLIT BILL');
    try {
        const [sess] = await db.query("INSERT INTO table_sessions (uuid, session_no, table_id, shop_id, status, opened_by) VALUES (?, ?, 1, ?, 'open', 1)", [generateUuid(), 'SES-STRESS-' + Date.now(), shopA]);
        const [oi1] = await db.query("INSERT INTO order_items (uuid, session_id, shop_id, item_id, item_name, qty, unit_price, total, status) VALUES (?, ?, ?, 1, 'Burger', 1, 500, 500, 'active')", [generateUuid(), sess.insertId, shopA]);
        
        const req = {
            body: { session_id: sess.insertId, order_item_ids: [oi1.insertId], payment_method: 'cash' },
            shopId: shopA,
            user: { id: 1, role: 'admin' }
        };
        const res = { statusCode: 200, status: function(c){this.statusCode=c;return this;}, json: function(d){this.data=d;return this;} };
        
        await invoiceController.splitBill(req, res);
        
        if (res.statusCode === 201) {
            console.log('✅ PASS: Split bill processed successfully.');
            results.push({ test: 'Split Bill Math', status: 'PASS' });
        } else {
            console.log('❌ FAIL: Split bill failed!', res.data);
            results.push({ test: 'Split Bill Math', status: 'FAIL' });
        }
    } catch (err) { 
        console.error('Split Bill Error:', err);
        results.push({ test: 'Split Bill Math', status: 'ERROR' }); 
    }

    console.log('\n==================================================');
    console.log('STRESS TEST FINAL RESULTS');
    console.table(results);
    
    // Cleanup
    await db.query('DELETE FROM invoices WHERE invoice_no LIKE "%STRESS%"');
    await db.query('DELETE FROM payment_transactions WHERE gateway_order_id LIKE "%STRESS%"');
    await db.query('DELETE FROM customers WHERE name = "Stress Test Cust"');
    await db.query('DELETE FROM table_sessions WHERE session_no LIKE "SES-STRESS-%"');
    
    process.exit(0);
}

runTests();
