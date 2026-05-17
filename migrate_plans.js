const { db } = require('./backend/config/db');

async function migratePlansTable() {
    try {
        console.log('--- Migrating Subscription Plans Schema ---');
        
        // Add module_permissions column
        await db.query(`
            ALTER TABLE subscription_plans 
            ADD COLUMN IF NOT EXISTS module_permissions JSON NULL AFTER features
        `);
        
        console.log('Schema updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migratePlansTable();
