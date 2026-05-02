const http = require('http');

const PORT = 5000;
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

async function testRBAC() {
    console.log('--- TESTING RBAC FOR BI MODULE ---');

    // 1. Login as Cashier
    console.log('Attempting login as cashier...');
    const loginRes = await request({
        hostname: HOST,
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, {
        email: 'cashier@restopos.com',
        password: 'admin123'
    });

    const token = loginRes.data.data.token;
    console.log('Cashier logged in.');

    // 2. Try to access BI
    console.log('Testing access to /api/reports/business-intelligence as Cashier...');
    const res = await request({
        hostname: HOST,
        port: PORT,
        path: '/api/reports/business-intelligence',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.statusCode === 403) {
        console.log('[PASS] Access correctly DENIED (403 Forbidden).');
    } else {
        console.error(`[FAIL] Access was NOT denied. Status: ${res.statusCode}`, res.data);
    }
}

testRBAC();
