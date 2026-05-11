const { db } = require('../config/db');
const { generateUuid } = require('../utils/identifier');

async function seedAnalytics() {
    try {
        console.log('Seeding Platform Analytics Data...');
        
        const [shops] = await db.query('SELECT id FROM shops');
        if (shops.length === 0) {
            console.log('No shops found to seed payments for.');
            process.exit(0);
        }

        await db.query('DELETE FROM subscription_payments');

        const now = new Date();
        const payments = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 15);
            const dateStr = date.toISOString().slice(0, 19).replace('T', ' '); // YYYY-MM-DD HH:mm:ss
            
            for (const shop of shops) {
                const amount = 3500 + (Math.random() * 1000 - 500);
                payments.push([
                    generateUuid(),
                    shop.id,
                    amount,
                    'bank_transfer',
                    `SA-PAY-${Date.now()}-${shop.id}-${i}`,
                    dateStr.slice(0, 10), // period_start
                    dateStr.slice(0, 10), // period_end
                    1,
                    'Monthly subscription seed',
                    dateStr // created_at
                ]);
            }
        }

        if (payments.length > 0) {
            await db.query(
                'INSERT INTO subscription_payments (uuid, shop_id, amount, payment_method, reference_no, period_start, period_end, recorded_by, note, created_at) VALUES ?',
                [payments]
            );
            console.log(`Successfully seeded ${payments.length} historical payments.`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedAnalytics();
