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

async function runSmokeTest() {
    console.log('--- STARTING AUTHENTICATED SMOKE TEST ---');

    // 1. Login
    console.log('Attempting login as admin...');
    const loginRes = await request({
        hostname: HOST,
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, {
        email: 'admin@restopos.com',
        password: 'admin123'
    });

    if (loginRes.statusCode !== 200 || !loginRes.data.data?.token) {
        console.error('Login failed!', loginRes.data);
        return;
    }

    const token = loginRes.data.data.token;
    console.log('Login successful! Token acquired.');

    const headers = {
        'Authorization': `Bearer ${token}`
    };

    const endpoints = [
        '/api/auth/me',
        '/api/invoices',
        '/api/customers',
        '/api/customers/debtors',
        '/api/reports/dashboard',
        '/api/reports/analytics',
        '/api/reports/alerts',
        '/api/reports/business-intelligence'
    ];

    for (const endpoint of endpoints) {
        console.log(`Testing ${endpoint}...`);
        const res = await request({
            hostname: HOST,
            port: PORT,
            path: endpoint,
            method: 'GET',
            headers: headers
        });

        if (res.statusCode === 200 && res.data.success) {
            console.log(`[PASS] ${endpoint} returned success.`);
        } else {
            console.error(`[FAIL] ${endpoint} returned ${res.statusCode}`, res.data);
        }
    }

    console.log('--- SMOKE TEST COMPLETE ---');
}

runSmokeTest();
