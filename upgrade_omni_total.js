const { db } = require('./backend/config/db');

async function upgradeOmniToTotalSuite() {
    try {
        console.log('--- Synthesizing Omni Enterprise Total Suite ---');

        const totalSuiteFeatures = JSON.stringify([
            'Neural BI Intelligence Console',
            'Advanced Inventory & Warehouse Matrix',
            'Full Kitchen Display System (KOT/KDS)',
            'Marketing & CRM Loyalty Hub',
            'Delivery Logistics & Tracking Engine',
            'HR & Payroll Intelligence Suite',
            'Naya Book (Advanced Credit Ledger)',
            'Cloud Audit & Security Registry',
            'Unlimited Staff & Node Provisioning',
            'Multi-Outlet Global Synchronization',
            'White-label Custom Branding Suite',
            'Automated Enterprise Cloud Backups',
            'Dedicated 24/7 Priority Concierge'
        ]);

        const totalPermissions = JSON.stringify({
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
            naya_book: true,
            settings: true,
            support: true,
            multitenant: true
        });

        await db.query(
            `UPDATE subscription_plans 
             SET features = ?, module_permissions = ? 
             WHERE plan_key = 'omni_enterprise'`,
            [totalSuiteFeatures, totalPermissions]
        );

        console.log('--- Omni Enterprise Successfully Unified with Total System ---');
        process.exit(0);
    } catch (error) {
        console.error('Synthesis Failed:', error);
        process.exit(1);
    }
}

upgradeOmniToTotalSuite();
