const { db } = require('../config/db');

async function checkData() {
    try {
        const [payments] = await db.query('SELECT COUNT(*) as cnt FROM subscription_payments');
        console.log('Payments Count:', payments[0].cnt);
        
        const [shops] = await db.query('SELECT id, name FROM shops LIMIT 5');
        console.log('Shops:', shops);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
