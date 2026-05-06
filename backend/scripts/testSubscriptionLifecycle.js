const { db } = require('../config/db');
const { resolveEffectiveSubscriptionStatus } = require('../services/subscriptionService');

async function testStatusResolution() {
    console.log('--- Testing Subscription Status Resolution ---');

    const mockShops = [
        {
            name: 'Active Shop',
            subscription_status: 'active',
            subscription_end_date: new Date(Date.now() + 86400000 * 5), // 5 days from now
            grace_until: new Date(Date.now() + 86400000 * 12),
            expected: 'active'
        },
        {
            name: 'Grace Shop',
            subscription_status: 'active',
            subscription_end_date: new Date(Date.now() - 86400000 * 2), // 2 days ago
            grace_until: new Date(Date.now() + 86400000 * 5),
            expected: 'grace'
        },
        {
            name: 'Restricted Shop',
            subscription_status: 'active',
            subscription_end_date: new Date(Date.now() - 86400000 * 10), // 10 days ago
            grace_until: new Date(Date.now() - 86400000 * 2), // 2 days ago
            expected: 'restricted'
        },
        {
            name: 'Locked Shop',
            subscription_status: 'locked',
            subscription_end_date: new Date(Date.now() + 86400000 * 5),
            expected: 'locked'
        },
        {
            name: 'Trial Shop',
            subscription_status: 'trial',
            trial_ends_at: new Date(Date.now() + 86400000 * 2),
            expected: 'trial'
        },
        {
            name: 'Expired Trial',
            subscription_status: 'trial',
            trial_ends_at: new Date(Date.now() - 86400000 * 2),
            expected: 'restricted'
        }
    ];

    let passed = 0;
    for (const shop of mockShops) {
        const resolved = resolveEffectiveSubscriptionStatus(shop);
        if (resolved === shop.expected) {
            console.log(`✅ PASS: ${shop.name} resolved to ${resolved}`);
            passed++;
        } else {
            console.log(`❌ FAIL: ${shop.name} resolved to ${resolved} (expected ${shop.expected})`);
        }
    }

    console.log(`\nResult: ${passed}/${mockShops.length} Passed`);
    process.exit(passed === mockShops.length ? 0 : 1);
}

testStatusResolution();
