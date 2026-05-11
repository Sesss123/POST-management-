const { db } = require('../config/db');

async function checkSchema() {
    try {
        const tables = ['subscription_plans', 'subscription_payments', 'subscription_logs', 'shops', 'audit_logs'];
        for (const table of tables) {
            console.log(`--- ${table} ---`);
            try {
                const [cols] = await db.query(`DESCRIBE ${table}`);
                console.table(cols);
            } catch (e) {
                console.error(`Table ${table} MISSING`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
