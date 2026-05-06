/**
 * Subscription Middleware
 * Enforces SaaS subscription rules on a per-request basis.
 */
const { resolveEffectiveSubscriptionStatus } = require('../services/subscriptionService');

// Routes that are always permitted regardless of subscription state
const ALWAYS_ALLOWED_PREFIXES = [
    '/api/auth',
    '/api/public-menu',
    '/api/super-admin',       // platform management bypasses shop subscription checks
];

// Routes blocked in RESTRICTED mode (Advanced features blocked, POS core allowed)
const RESTRICTED_BLOCKED_PREFIXES = [
    '/api/reports',
    '/api/backups',
    '/api/promotions',
    '/api/audit-logs',
    '/api/business-intelligence',
    '/api/suppliers',
    '/api/purchases',
    '/api/exports',
];

// Routes partially blocked in RESTRICTED mode (Read-only access)
const RESTRICTED_READONLY_PREFIXES = [
    '/api/settings',
    '/api/users',
    '/api/items',
    '/api/tables',
];

// Routes blocked in LOCKED mode (New sales operations)
const LOCKED_BLOCKED_PREFIXES = [
    '/api/invoices/cash-sale',
    '/api/invoices/table-checkout',
    '/api/quick-retail',
    '/api/kot/create',
    '/api/held-bills/complete',
];

const subscriptionMiddleware = async (req, res, next) => {
    // 1. Skip for super_admin
    if (req.user?.role === 'super_admin') return next();

    // 2. Skip routes that are always allowed
    const path = req.originalUrl.split('?')[0];
    const alwaysAllowed = ALWAYS_ALLOWED_PREFIXES.some(prefix => path.startsWith(prefix));
    if (alwaysAllowed) return next();

    // 3. Ensure subscription data is attached (by tenantMiddleware)
    if (!req.subscription) return next();

    // 4. Resolve effective status using service logic
    const status = resolveEffectiveSubscriptionStatus(req.subscription);
    req.subscription.effectiveStatus = status;

    // 5. Handle BLOCKED states (suspended, cancelled)
    if (status === 'suspended' || status === 'cancelled') {
        return res.status(403).json({
            success: false,
            message: `Your account is ${status}. Access is denied.`,
            subscription: { status }
        });
    }

    // 6. Handle LOCKED state
    if (status === 'locked') {
        const isActionBlocked = LOCKED_BLOCKED_PREFIXES.some(prefix => path.includes(prefix));
        if (isActionBlocked) {
            return res.status(402).json({
                success: false,
                code: 'ACCOUNT_LOCKED',
                message: 'Your account is locked due to non-payment. New operations are blocked.',
                subscription: { status }
            });
        }
    }

    // 7. Handle RESTRICTED state
    if (status === 'restricted') {
        const isFullyBlocked = RESTRICTED_BLOCKED_PREFIXES.some(prefix => path.startsWith(prefix));
        if (isFullyBlocked) {
            return res.status(402).json({
                success: false,
                code: 'SUBSCRIPTION_EXPIRED',
                message: 'Feature locked. Renew your subscription to access advanced features.',
                subscription: { status }
            });
        }

        const isReadonlyBlocked = RESTRICTED_READONLY_PREFIXES.some(prefix => path.startsWith(prefix));
        if (isReadonlyBlocked && req.method !== 'GET') {
            return res.status(402).json({
                success: false,
                code: 'SUBSCRIPTION_EXPIRED',
                message: 'Renew subscription to make changes to settings or menu.',
                subscription: { status }
            });
        }
    }

    // Trial, Active, and Grace pass through (grace shows banner on frontend)
    next();
};

module.exports = { subscriptionMiddleware };
