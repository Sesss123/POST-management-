const { db } = require('../config/db');

async function checkMissing() {
    const tables = ['subscription_plans', 'subscription_payments', 'subscription_logs', 'shops', 'subscription_plans'];
    for (const table of tables) {
        try {
            await db.query(`DESCRIBE ${table}`);
            console.log(`TABLE ${table}: OK`);
        } catch (e) {
            console.log(`TABLE ${table}: MISSING`);
        }
    }
    process.exit(0);
}

checkMissing();
