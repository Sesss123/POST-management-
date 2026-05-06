const { db } = require('./config/db');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
const GATEWAY_URL = 'http://localhost:5000/api/payments/gateway';
let adminToken = '';

async function login(email, password) {
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const result = await res.json();
        if (!result.success) return null;
        return result.data.token;
    } catch (err) {
        return null;
    }
}

async function runQA() {
    console.log('--- Starting QR Gateway QA ---');
    
    adminToken = await login('qa@test.com', '123456');
    if (!adminToken) {
        console.error('Login failed. Aborting.');
        return;
    }

    const adminHeader = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

    // 1. Cash Sale QR Flow
    console.log('\n[1] Testing Cash Sale QR Flow...');
    try {
        const res = await fetch(`${GATEWAY_URL}/qr/create`, {
            method: 'POST',
            headers: adminHeader,
            body: JSON.stringify({
                items: [{ item_id: 1, qty: 1 }],
                payment_method: 'qr',
                order_type: 'takeaway',
                source: 'cash_sale'
            })
        });
        const qrRes = await res.json();
        if (!qrRes.success) throw new Error(qrRes.message);
        
        const { invoice_id, transaction_uuid } = qrRes.data;
        console.log(`- QR Created: Invoice ${invoice_id}, TX ${transaction_uuid}`);

        const [invPending] = await db.query('SELECT payment_status FROM invoices WHERE id = ?', [invoice_id]);
        console.log(`- Invoice Status: ${invPending[0].payment_status} (Expected: pending)`);
        
        await fetch(`${GATEWAY_URL}/mock/${transaction_uuid}/mark-paid`, { method: 'POST', headers: adminHeader });

        const [invPaid] = await db.query('SELECT payment_status, paid_amount FROM invoices WHERE id = ?', [invoice_id]);
        console.log(`- Invoice Status: ${invPaid[0].payment_status} (Expected: paid)`);
        console.log(`- Paid Amount correctly set: ${invPaid[0].paid_amount > 0 ? 'PASS' : 'FAIL'}`);

    } catch (err) {
        console.error('Cash Sale QA Failed:', err.message);
    }

    // 2. Table Billing QR Flow
    console.log('\n[2] Testing Table Billing QR Flow...');
    try {
        const [tables] = await db.query('SELECT id FROM restaurant_tables WHERE status = "available" LIMIT 1');
        if (tables.length === 0) throw new Error('No available tables');
        const tableId = tables[0].id;

        const res = await fetch(`${API_URL}/table-sessions/start`, {
            method: 'POST',
            headers: adminHeader,
            body: JSON.stringify({ table_id: tableId, waiter_id: 1, initial_items: [{ item_id: 1, qty: 1 }] })
        });
        const sessionRes = await res.json();
        const sessionUuid = sessionRes.data.uuid;

        const qrResFetch = await fetch(`${GATEWAY_URL}/qr/create`, {
            method: 'POST',
            headers: adminHeader,
            body: JSON.stringify({ 
                session_id: sessionUuid, 
                items: [{ item_id: 1, qty: 1 }], 
                payment_method: 'qr', 
                source: 'table_billing' 
            })
        });
        const qrRes = await qrResFetch.json();
        const { transaction_uuid } = qrRes.data;

        await fetch(`${GATEWAY_URL}/mock/${transaction_uuid}/mark-paid`, { method: 'POST', headers: adminHeader });

        const [tableAvailable] = await db.query('SELECT status FROM restaurant_tables WHERE id = ?', [tableId]);
        console.log(`- Table Status after paid: ${tableAvailable[0].status} (Expected: available)`);

    } catch (err) {
        console.error('Table Billing QA Failed:', err.message);
    }

    // 3. Idempotency Test
    console.log('\n[3] Testing Idempotency...');
    try {
        const res = await fetch(`${GATEWAY_URL}/qr/create`, {
            method: 'POST',
            headers: adminHeader,
            body: JSON.stringify({ items: [{ item_id: 1, qty: 1 }], payment_method: 'qr' })
        });
        const qrRes = await res.json();
        const { transaction_uuid, invoice_id } = qrRes.data;

        await fetch(`${GATEWAY_URL}/mock/${transaction_uuid}/mark-paid`, { method: 'POST', headers: adminHeader });
        const res2 = await fetch(`${GATEWAY_URL}/mock/${transaction_uuid}/mark-paid`, { method: 'POST', headers: adminHeader });
        const data2 = await res2.json();
        console.log(`- Second Mark Paid Response: ${data2.message}`);

        const [payments] = await db.query('SELECT COUNT(*) as count FROM invoice_payments WHERE invoice_id = ?', [invoice_id]);
        console.log(`- Payment Count: ${payments[0].count} (Expected: 1)`);

    } catch (err) {
        console.error('Idempotency QA Failed:', err.message);
    }

    // 4. Audit Logs
    console.log('\n[4] Checking Audit Logs...');
    try {
        const [logs] = await db.query('SELECT action FROM audit_logs WHERE action LIKE "qr_payment_%" ORDER BY id DESC LIMIT 5');
        console.log('- Recent QR Logs:', logs.map(l => l.action).join(', '));
    } catch (err) {
        console.error('Audit Logs QA Failed:', err.message);
    }

    console.log('\n--- QA Finished ---');
    process.exit(0);
}

runQA();
