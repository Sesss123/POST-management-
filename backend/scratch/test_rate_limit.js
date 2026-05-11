const http = require('http');

async function testRateLimit(path, method, body, count) {
    console.log(`Testing rate limit for ${path} (${count} requests)...`);
    for (let i = 1; i <= count; i++) {
        const result = await new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: 5000,
                path: path,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                }
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve({ statusCode: res.statusCode, data: JSON.parse(data) }));
            });
            req.on('error', (err) => resolve({ error: err.message }));
            if (body) req.write(JSON.stringify(body));
            req.end();
        });

        if (result.statusCode === 429) {
            console.log(`[PASS] Request ${i} blocked with 429 Too Many Requests`);
            console.log('Response:', result.data);
            return;
        } else if (result.statusCode === 401 || result.statusCode === 200 || result.statusCode === 403) {
            // console.log(`Request ${i}: ${result.statusCode}`);
        } else {
            console.log(`Request ${i} failed with status ${result.statusCode}:`, result.data);
        }
    }
    console.log(`[FAIL] Successfully sent all ${count} requests without being rate limited.`);
}

async function runTests() {
    // Test Auth Limiter (Limit 10)
    await testRateLimit('/api/auth/login', 'POST', { email: 'test@example.com', password: 'wrong' }, 15);
    
    // Test Public Menu Limiter (Limit 300) - Just checking if it works for first few
    await testRateLimit('/api/public-menu/categories?shop_id=1', 'GET', null, 5);
}

runTests();
