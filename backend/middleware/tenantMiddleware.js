/**
 * Tenant Isolation Middleware
 * Enforces shop_id scoping for all requests.
 * Also fetches subscription data in the same query to avoid extra round-trips.
 */

const { db } = require('../config/db');

const tenantMiddleware = async (req, res, next) => {
    // 1. Skip for public routes (public menu has its own shop scoping logic)
    if (req.path.startsWith('/public-menu')) {
        return next();
    }

    // 2. Ensure user is authenticated (req.user is set by auth middleware)
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { role, shopId: userShopId } = req.user;

    // 3. Super Admin logic — no shop scope needed
    if (role === 'super_admin') {
        const overrideShopId = req.query.shop_id || req.headers['x-shop-id'];
        req.shopId = overrideShopId ? parseInt(overrideShopId) : null;
        return next();
    }

    // 4. Normal User — must belong to a shop
    if (!userShopId) {
        return res.status(403).json({ success: false, message: 'User is not assigned to any shop' });
    }

    req.shopId = userShopId;

    // 5. Verify Shop Status + fetch subscription data in ONE query
    try {
        const [shops] = await db.query(
            `SELECT 
                id, status, name, identifier,
                subscription_status, subscription_plan,
                subscription_end_date, grace_until, trial_ends_at,
                locked_at, last_payment_date, next_billing_date
             FROM shops 
             WHERE id = ?`,
            [req.shopId]
        );

        if (shops.length === 0) {
            return res.status(403).json({ success: false, message: 'Shop not found' });
        }

        const shop = shops[0];

        // Block if the shop itself is deactivated/suspended at the account level
        if (shop.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: `Shop is ${shop.status}. Access denied.`
            });
        }

        // Attach subscription data for subscriptionMiddleware to consume
        req.subscription = {
            subscription_status:   shop.subscription_status,
            subscription_plan:     shop.subscription_plan,
            subscription_end_date: shop.subscription_end_date,
            grace_until:           shop.grace_until,
            trial_ends_at:         shop.trial_ends_at,
            locked_at:             shop.locked_at,
            last_payment_date:     shop.last_payment_date,
            next_billing_date:     shop.next_billing_date,
        };

    } catch (err) {
        console.error('Tenant Middleware Error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }

    next();
};

module.exports = tenantMiddleware;
