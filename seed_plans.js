const { db } = require('./backend/config/db');

async function seedProfessionalPlans() {
    try {
        console.log('--- Initializing Neural Pricing Architecture ---');

        // Clear existing plans (Optional, but ensures fresh start for presets)
        await db.query('DELETE FROM subscription_plans');

        const plans = [
            {
                name: 'Starter Node',
                plan_key: 'starter_node',
                monthly_price: 2500,
                yearly_price: 25000,
                billing_interval: 'monthly',
                features: JSON.stringify([
                    'Basic POS Terminal',
                    'Single User Access',
                    'Daily Sales Reports',
                    'Digital Receipting',
                    'Standard Support'
                ]),
                module_permissions: JSON.stringify({
                    pos: true,
                    reports: true,
                    inventory: false,
                    kot: false
                }),
                is_active: true
            },
            {
                name: 'Business Stream',
                plan_key: 'business_stream',
                monthly_price: 5500,
                yearly_price: 55000,
                billing_interval: 'monthly',
                features: JSON.stringify([
                    'Multi-Terminal Support',
                    'Inventory Management',
                    'KOT Kitchen Displays',
                    'Customer Database (CRM)',
                    'Multi-User Permissions',
                    'Priority Email Support'
                ]),
                module_permissions: JSON.stringify({
                    pos: true,
                    reports: true,
                    inventory: true,
                    kot: true,
                    crm: true
                }),
                is_active: true
            },
            {
                name: 'Ultimate Neural',
                plan_key: 'ultimate_neural',
                monthly_price: 9500,
                yearly_price: 95000,
                billing_interval: 'monthly',
                features: JSON.stringify([
                    'All Standard Features',
                    'AI Sales Forecasting',
                    'Mobile Management App',
                    'Advanced Marketing Tools',
                    'API Access Keys',
                    '24/7 Priority Concierge',
                    'Automated Cloud Backups'
                ]),
                module_permissions: JSON.stringify({
                    pos: true,
                    reports: true,
                    inventory: true,
                    kot: true,
                    crm: true,
                    analytics: true,
                    marketing: true,
                    delivery: true
                }),
                is_active: true
            }
        ];

        for (const plan of plans) {
            await db.query(
                `INSERT INTO subscription_plans 
                (name, plan_key, monthly_price, yearly_price, billing_interval, features, module_permissions, is_active) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [plan.name, plan.plan_key, plan.monthly_price, plan.yearly_price, plan.billing_interval, plan.features, plan.module_permissions, plan.is_active]
            );
            console.log(`Plan Initialized: ${plan.name}`);
        }

        console.log('--- Pricing Architecture Successfully Deployed ---');
        process.exit(0);
    } catch (error) {
        console.error('Deployment Failed:', error);
        process.exit(1);
    }
}

seedProfessionalPlans();
