const { db } = require('./backend/config/db');

async function upgradeUltimateNeural() {
    try {
        console.log('--- Enhancing Ultimate Neural Tier Logic ---');

        const ultimateFeatures = JSON.stringify([
            'Neural BI Intelligence Console',
            'Advanced Marketing Hub (CRM)',
            'Cloud Audit & Security Registry',
            'Multi-Terminal Real-time Sync',
            'Mobile Management Interface',
            'Automated Cloud Data Backups',
            'Priority 24/7 Concierge Support',
            'Custom Branding & White-labeling',
            'API Access for External Integrations'
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
            backups: true
        });

        await db.query(
            `UPDATE subscription_plans 
             SET features = ?, module_permissions = ? 
             WHERE plan_key = 'ultimate_neural'`,
            [ultimateFeatures, modulePermissions]
        );

        console.log('--- Ultimate Neural Tier Successfully Upgraded ---');
        process.exit(0);
    } catch (error) {
        console.error('Upgrade Failed:', error);
        process.exit(1);
    }
}

upgradeUltimateNeural();
