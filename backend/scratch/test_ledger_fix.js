const http = require('http');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;
const HOST = 'localhost';

async function request(options, body = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : null;
                    resolve({ statusCode: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data: data });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function testLedger() {
    // 1. Login
    const loginRes = await request({
        hostname: HOST, port: PORT, path: '/api/auth/login', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@restopos.com', password: 'admin123' });

    const token = loginRes.data.data.token;

    // 2. Test Ledger for ID 4
    console.log('Testing Ledger for Customer ID 4...');
    const res = await request({
        hostname: HOST, port: PORT, path: '/api/customers/4/ledger', method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.statusCode === 200 && res.data.success) {
        console.log('[PASS] Ledger returned success.');
        console.log('Sample payment allocations:', res.data.data.ledger.filter(l => l.type === 'payment').slice(0, 1));
    } else {
        console.error(`[FAIL] Ledger failed with status ${res.statusCode}`, res.data);
    }
}

testLedger();
