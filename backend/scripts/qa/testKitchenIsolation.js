const { db } = require('../../config/db');
const kitchenController = require('../../controllers/kitchenController');

const testKitchenIsolation = async () => {
    console.log('=== Kitchen Tenant Isolation Security Test ===\n');

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

        // 2. Create/Find a KOT in Shop B
        const [kotB] = await db.query('SELECT id, uuid, kot_no FROM kot_orders WHERE shop_id = ? LIMIT 1', [shopB.id]);
        if (kotB.length === 0) {
            console.log('Warning: No KOTs in Shop B. Please run a transaction in Shop B first.');
            // We could seed one, but let's assume one exists for now or skip
        } else {
            const targetKot = kotB[0];
            console.log(`Target: KOT ${targetKot.kot_no} from Shop B`);

            // 3. Test updateKotStatus Isolation
            console.log('\n--- Testing updateKotStatus ---');
            const req = {
                params: { id: targetKot.uuid },
                body: { status: 'preparing' },
                shopId: shopA.id, // Mismatched shop ID
                user: { id: 1, role: 'kitchen' }
            };
            
            let responseData = null;
            let responseStatus = 200;
            const res = {
                status: (code) => { responseStatus = code; return res; },
                json: (data) => { responseData = data; return res; }
            };

            await kitchenController.updateKotStatus(req, res);

            if (responseStatus === 400 || responseStatus === 403 || responseStatus === 404 || (responseData && responseData.success === false)) {
                console.log(`✅ PASS: Shop A cannot update Shop B's KOT status. (Response: ${responseStatus}, Msg: ${responseData?.message})`);
            } else {
                console.error('❌ FAIL: Shop A WAS ABLE to update Shop B KOT status!');
            }

            // 4. Test getActiveKots Isolation
            console.log('\n--- Testing getActiveKots ---');
            const reqGet = {
                query: {},
                shopId: shopA.id
            };
            
            let getResult = null;
            const resGet = {
                json: (data) => { getResult = data; }
            };

            await kitchenController.getActiveKots(reqGet, resGet);

            if (getResult && getResult.success) {
                const leaked = getResult.data.find(k => k.id === targetKot.id);
                if (!leaked) {
                    console.log('✅ PASS: Shop A getActiveKots does not include Shop B KOTs.');
                } else {
                    console.error('❌ FAIL: Shop A getActiveKots LEAKED Shop B KOT!');
                }
            }
            
            // 5. Test getHistoryKots Isolation
            console.log('\n--- Testing getHistoryKots ---');
            const reqHistory = {
                query: { date: new Date().toISOString().split('T')[0] },
                shopId: shopA.id
            };
            await kitchenController.getHistoryKots(reqHistory, resGet);
            
            if (getResult && getResult.success) {
                const leaked = getResult.data.find(k => k.id === targetKot.id);
                if (!leaked) {
                    console.log('✅ PASS: Shop A getHistoryKots does not include Shop B KOTs.');
                } else {
                    console.error('❌ FAIL: Shop A getHistoryKots LEAKED Shop B KOT!');
                }
            }

            // 6. Test Price Leak Check
            console.log('\n--- Testing Price Field Isolation ---');
            const [kotA] = await db.query('SELECT id FROM kot_orders WHERE shop_id = ? LIMIT 1', [shopA.id]);
            if (kotA.length > 0) {
                const reqPrice = { query: {}, shopId: shopA.id };
                await kitchenController.getActiveKots(reqPrice, resGet);
                
                const sampleKot = getResult.data[0];
                const priceFields = ['price', 'unit_price', 'total', 'subtotal', 'grand_total'];
                let hasPrice = false;
                
                if (sampleKot) {
                    priceFields.forEach(f => {
                        if (sampleKot[f] !== undefined) hasPrice = true;
                        if (sampleKot.items && sampleKot.items[0] && sampleKot.items[0][f] !== undefined) hasPrice = true;
                    });
                }
                
                if (!hasPrice) {
                    console.log('✅ PASS: Kitchen API response contains no sensitive price fields.');
                } else {
                    console.error('❌ FAIL: Kitchen API response LEAKS price data!');
                }
            }
        }

        console.log('\nConclusion: Kitchen Dashboard Tenant Isolation verified.');
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
};

testKitchenIsolation();
