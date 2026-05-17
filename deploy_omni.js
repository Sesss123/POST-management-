const { db } = require('./backend/config/db');

async function deployOmniEnterprise() {
    try {
        console.log('--- Deploying Omni Enterprise Protocol ---');

        const omniFeatures = JSON.stringify([
            'Full System Access (All Modules)',
            'Unlimited Staff & Terminal Nodes',
            'Unlimited Inventory SKU Management',
            'White-label Custom Branding Suite',
            'Multi-Outlet Global Synchronization',
            'Advanced HR & Payroll Intelligence',
            'Dedicated 24/7 Priority Manager',
            'Automated Enterprise Backups',
            'Early Access to Neural Updates'
        ]);

        const modulePermissions = JSON.stringify({
            pos: true,
            reports: true,
            inventory: true,
            kot: true,
            crm: true,
            analytics: true,
            marketing: true,
            delivery: true,
            audit: true,
            backups: true,
            hr: true,
            payroll: true,
            settings: true,
            support: true
        });

        await db.query(
            `INSERT INTO subscription_plans 
            (name, plan_key, monthly_price, yearly_price, billing_interval, features, module_permissions, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'Omni Enterprise', 
                'omni_enterprise', 
                15000, 
                150000, 
                'monthly', 
                omniFeatures, 
                modulePermissions, 
                true
            ]
        );

        console.log('--- Omni Enterprise Successfully Deployed ---');
        process.exit(0);
    } catch (error) {
        console.error('Deployment Failed:', error);
        process.exit(1);
    }
}

deployOmniEnterprise();
