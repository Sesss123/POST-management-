const { db } = require('./backend/config/db');

async function addSetupFeeColumn() {
    try {
        console.log('--- Injecting Setup Fee Infrastructure ---');
        
        await db.query(`
            ALTER TABLE subscription_plans 
            ADD COLUMN IF NOT EXISTS setup_fee DECIMAL(10, 2) DEFAULT 0.00 AFTER monthly_price
        `);
        
        // Update default plans with some setup fees
        await db.query("UPDATE subscription_plans SET setup_fee = 5000 WHERE plan_key = 'starter_node'");
        await db.query("UPDATE subscription_plans SET setup_fee = 10000 WHERE plan_key = 'business_stream'");
        await db.query("UPDATE subscription_plans SET setup_fee = 15000 WHERE plan_key = 'ultimate_neural'");
        await db.query("UPDATE subscription_plans SET setup_fee = 25000 WHERE plan_key = 'omni_enterprise'");

        console.log('Setup Fee column added and defaults synchronized.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

addSetupFeeColumn();
