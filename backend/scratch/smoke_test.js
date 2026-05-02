const http = require('http');

const endpoints = [
    '/api/invoices',
    '/api/customers',
    '/api/customers/debtors',
    '/api/reports/dashboard'
];

async function test() {
    for (const endpoint of endpoints) {
        console.log(`Testing ${endpoint}...`);
        try {
            const req = http.request({
                hostname: 'localhost',
                port: 5000,
                path: endpoint,
                method: 'GET'
            }, (res) => {
                console.log(`Response for ${endpoint}: ${res.statusCode}`);
            });
            
            req.on('error', (e) => {
                console.error(`Error for ${endpoint}: ${e.message}`);
            });
            
            req.end();
            await new Promise(r => setTimeout(r, 1000));
        } catch (error) {
            console.error(`Failed ${endpoint}: ${error.message}`);
        }
    }
}

test();
