const fs = require('fs');
const path = require('path');
const { db } = require('../config/db');
const { generateUuid } = require('../utils/identifier');
const bcrypt = require('bcryptjs');
const subscriptionService = require('../services/subscriptionService');

// ─── System Health ─────────────────────────────────────────────────────────────

/**
 * GET /api/super-admin/system-health
 * Returns real platform health data. Never exposes secrets.
 */
exports.getSystemHealth = async (req, res) => {
    const now = new Date();
    const alerts = [];

    // ── 1. Server — all from Node.js process object ──────────────────────────
    const memRaw = process.memoryUsage();
    const server = {
        status: 'online',
        uptime_seconds: Math.floor(process.uptime()),
        node_version: process.version,
        environment: process.env.NODE_ENV || 'development',
        platform: process.platform,
        // memory_total_mb: null — Node has no safe cross-platform total RAM API
        memory_used_mb: Math.round(memRaw.rss / 1024 / 1024),
        memory_total_mb: null,
        memory_heap_used_mb: Math.round(memRaw.heapUsed / 1024 / 1024),
        memory_heap_total_mb: Math.round(memRaw.heapTotal / 1024 / 1024),
    };

    // ── 2. Database — real query ──────────────────────────────────────────────
    let database = {
        status: 'disconnected',
        database_name: null,
        table_count: 0,
        last_check: now.toISOString(),
    };

    try {
        const [[dbNameRow]] = await db.query('SELECT DATABASE() AS db_name');
        const [tables] = await db.query('SHOW TABLES');
        database = {
            status: 'connected',
            database_name: dbNameRow.db_name,
            table_count: tables.length,
            last_check: now.toISOString(),
        };
    } catch (err) {
        alerts.push({
            type: 'critical',
            title: 'Database connection failed',
            description: 'The system could not connect to MySQL.'
        });
    }

    // ── 3. Shops — real COUNT queries ────────────────────────────────────────
    let shops = { total: 0, active: 0, inactive: 0, suspended: 0 };

    try {
        const [[counts]] = await db.query(`
            SELECT
                COUNT(*) as total,
                SUM(status = 'active') as active_count,
                SUM(status = 'inactive') as inactive_count,
                SUM(status = 'suspended') as suspended_count
            FROM shops
        `);
        shops = {
            total:     counts.total     || 0,
            active:    counts.active_count    || 0,
            inactive:  counts.inactive_count  || 0,
            suspended: counts.suspended_count || 0,
        };
    } catch (err) {
        alerts.push({
            type: 'warning',
            title: 'Shops table not found',
            description: 'Could not read shop status data.'
        });
    }

    // ── 4. Subscriptions — real counts, no arrays ─────────────────────────────
    let subscriptions = {
        active: 0, grace: 0, restricted: 0, locked: 0,
        due_soon_count: 0, expired_count: 0,
    };

    try {
        const [subRows] = await db.query(
            `SELECT subscription_status, subscription_end_date, grace_until FROM shops`
        );

        for (const s of subRows) {
            const eff = subscriptionService.resolveEffectiveSubscriptionStatus(s);
            if (eff === 'active' || eff === 'trial') subscriptions.active++;
            else if (eff === 'grace')      subscriptions.grace++;
            else if (eff === 'restricted') subscriptions.restricted++;
            else if (eff === 'locked')     subscriptions.locked++;

            // due_soon: active but expiring within 7 days
            if (eff === 'active' && s.subscription_end_date) {
                const daysLeft = Math.ceil((new Date(s.subscription_end_date) - now) / 86400000);
                if (daysLeft >= 0 && daysLeft <= 7) subscriptions.due_soon_count++;
            }
            // expired: past end_date (grace + restricted + locked)
            if (eff !== 'active' && s.subscription_end_date && new Date(s.subscription_end_date) < now) {
                subscriptions.expired_count++;
            }
        }

        if (subscriptions.restricted > 0 || subscriptions.locked > 0) {
            alerts.push({
                type: 'warning',
                title: 'Subscription issues detected',
                description: `${subscriptions.restricted} shop(s) restricted, ${subscriptions.locked} shop(s) locked.`
            });
        }
        if (subscriptions.due_soon_count > 0) {
            alerts.push({
                type: 'warning',
                title: `${subscriptions.due_soon_count} subscription(s) expiring within 7 days`,
                description: 'Notify these shop owners to renew soon.'
            });
        }
    } catch (err) {
        alerts.push({
            type: 'warning',
            title: 'Subscription fields not available',
            description: 'Could not read subscription status from shops table.'
        });
    }

    // ── 5. Backups — from backup_logs table ───────────────────────────────────
    let backups = {
        enabled: process.env.BACKUP_ENABLED === 'true',
        last_backup_at: null,
        last_backup_status: 'not_available',
        backup_count: 0,
        retention_days: parseInt(process.env.BACKUP_RETENTION_DAYS || '14', 10),
    };

    try {
        const [[countRow]] = await db.query('SELECT COUNT(*) as cnt FROM backup_logs');
        backups.backup_count = Number(countRow.cnt) || 0;

        const [lastRow] = await db.query(
            'SELECT created_at, status FROM backup_logs ORDER BY created_at DESC LIMIT 1'
        );
        if (lastRow.length > 0) {
            backups.last_backup_at = lastRow[0].created_at;
            backups.last_backup_status = lastRow[0].status || 'unknown';
        }

        const oneDayAgo = new Date(now.getTime() - 86400000);
        if (!backups.last_backup_at || new Date(backups.last_backup_at) < oneDayAgo) {
            alerts.push({
                type: 'warning',
                title: 'No recent backup found',
                description: 'No successful backup was found in the last 24 hours.'
            });
        }
    } catch (err) {
        backups.last_backup_status = 'not_available';
        alerts.push({
            type: 'info',
            title: 'Backup logs table not found',
            description: 'The backup_logs table does not exist or could not be read.'
        });
    }

    // ── 6. Security — from audit_logs ─────────────────────────────────────────
    let security = {
        failed_logins_24h: 0,
        unauthorized_attempts_24h: 0,
        audit_logs_today: 0,
    };

    try {
        const oneDayAgo = new Date(now.getTime() - 86400000);
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const [[failedLogins]] = await db.query(
            `SELECT COUNT(*) as cnt FROM audit_logs WHERE action = 'login_failed' AND created_at >= ?`,
            [oneDayAgo]
        );
        const [[unauthorized]] = await db.query(
            `SELECT COUNT(*) as cnt FROM audit_logs WHERE action = 'unauthorized_access_attempt' AND created_at >= ?`,
            [oneDayAgo]
        );
        const [[logsToday]] = await db.query(
            `SELECT COUNT(*) as cnt FROM audit_logs WHERE created_at >= ?`,
            [todayStart]
        );

        security.failed_logins_24h         = Number(failedLogins.cnt)  || 0;
        security.unauthorized_attempts_24h  = Number(unauthorized.cnt) || 0;
        security.audit_logs_today           = Number(logsToday.cnt)    || 0;

        if (security.failed_logins_24h > 10) {
            alerts.push({
                type: 'warning',
                title: 'High failed login attempts',
                description: `${security.failed_logins_24h} failed login attempts detected in the last 24 hours.`
            });
        }
        if (security.unauthorized_attempts_24h > 5) {
            alerts.push({
                type: 'critical',
                title: 'Multiple unauthorized access attempts',
                description: `${security.unauthorized_attempts_24h} unauthorized route access attempts in the last 24 hours.`
            });
        }
    } catch (err) {
        alerts.push({
            type: 'info',
            title: 'Audit logs table not found',
            description: 'The audit_logs table does not exist or could not be read.'
        });
    }

    return res.json({
        success: true,
        data: {
            server,
            database,
            shops,
            subscriptions,
            backups,
            security,
            alerts,
            generated_at: now.toISOString(),
        }
    });
};


// ─── Platform Stats ─────────────────────────────────────────────────────────

exports.getStats = async (req, res) => {
    try {
        const [shopsCount] = await db.query('SELECT COUNT(*) as count FROM shops');
        const [usersCount] = await db.query('SELECT COUNT(*) as count FROM users');
        const [revenue] = await db.query('SELECT SUM(grand_total) as total FROM invoices WHERE payment_status != "cancelled"');
        const [recentShops] = await db.query('SELECT * FROM shops ORDER BY created_at DESC LIMIT 5');

        // Subscription health
        const [subStats] = await db.query(`
            SELECT 
                SUM(subscription_status = 'active') as active_count,
                SUM(subscription_status = 'grace') as grace_count,
                SUM(subscription_status = 'restricted') as restricted_count,
                SUM(subscription_status = 'locked') as locked_count
            FROM shops
        `);

        res.json({
            success: true,
            data: {
                shops_count: shopsCount[0].count,
                users_count: usersCount[0].count,
                total_revenue: revenue[0].total || 0,
                recent_shops: recentShops,
                subscription_health: subStats[0]
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * GET /api/super-admin/analytics
 * Advanced platform-level analytics for SaaS growth tracking.
 */
exports.getAnalytics = async (req, res) => {
    try {
        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // 1. Shop Distribution by Status
        const [statusDist] = await db.query(`
            SELECT 
                subscription_status as name, 
                COUNT(*) as value 
            FROM shops 
            GROUP BY subscription_status
        `);

        // 2. Monthly Recurring Revenue (MRR)
        // Calculated by summing the monthly_price of the plans of all active/trial/grace shops
        const [[mrrRow]] = await db.query(`
            SELECT SUM(p.monthly_price) as mrr
            FROM shops s
            JOIN subscription_plans p ON s.subscription_plan = p.plan_key
            WHERE s.subscription_status IN ('active', 'trial', 'grace')
        `);

        // 3. Subscription Payment Trend (Last 6 Months)
        const [paymentTrend] = await db.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                SUM(amount) as revenue
            FROM subscription_payments
            WHERE created_at >= ?
            GROUP BY month
            ORDER BY month ASC
        `, [sixMonthsAgo]);

        // 4. Shop Creation Trend
        const [shopTrend] = await db.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as count
            FROM shops
            WHERE created_at >= ?
            GROUP BY month
            ORDER BY month ASC
        `, [sixMonthsAgo]);

        // 5. Top Shops by Invoice Revenue
        const [topShops] = await db.query(`
            SELECT 
                s.name, 
                s.slug,
                COUNT(i.id) as invoice_count,
                SUM(i.grand_total) as total_revenue
            FROM shops s
            JOIN invoices i ON s.id = i.shop_id
            WHERE i.payment_status != 'cancelled'
            GROUP BY s.id
            ORDER BY total_revenue DESC
            LIMIT 10
        `);

        // 6. Platform Health Score (Simplified logic)
        // Score = (Active Shops / Total Shops) * 100
        const [[healthRow]] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(status = 'active') as active
            FROM shops
        `);
        const healthScore = healthRow.total > 0 ? (healthRow.active / healthRow.total) * 100 : 0;

        res.json({
            success: true,
            data: {
                status_distribution: statusDist,
                mrr: mrrRow.mrr || 0,
                payment_trend: paymentTrend,
                shop_trend: shopTrend,
                top_shops: topShops,
                health_score: Math.round(healthScore),
                total_shops: healthRow.total,
                active_shops: healthRow.active
            }
        });
    } catch (error) {
        console.error('[getAnalytics]', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── Shops ──────────────────────────────────────────────────────────────────

exports.getShops = async (req, res) => {
    try {
        const { search, status, plan } = req.query;
        let query = `
            SELECT 
                s.*,
                (SELECT COUNT(*) FROM users u WHERE u.shop_id = s.id) as user_count
            FROM shops s 
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ` AND (s.name LIKE ? OR s.slug LIKE ? OR s.email LIKE ?)`;
            const s = `%${search}%`;
            params.push(s, s, s);
        }

        if (status) {
            query += ` AND s.status = ?`;
            params.push(status);
        }

        if (plan) {
            query += ` AND s.subscription_plan = ?`;
            params.push(plan);
        }

        query += ` ORDER BY s.created_at DESC`;

        const [shops] = await db.query(query, params);

        // Compute effective status for each shop
        const enriched = shops.map(shop => ({
            ...shop,
            effective_subscription_status: resolveEffectiveStatus(shop)
        }));

        res.json({ success: true, data: enriched });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getShopById = async (req, res) => {
    try {
        const identifier = req.params.identifier;
        const [shops] = await db.query(
            `SELECT * FROM shops WHERE id = ? OR uuid = ? OR slug = ?`,
            [identifier, identifier, identifier]
        );

        if (shops.length === 0) {
            return res.status(404).json({ success: false, message: 'Shop not found' });
        }

        const shop = shops[0];
        shop.effective_subscription_status = resolveEffectiveStatus(shop);

        res.json({ success: true, data: shop });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createShop = async (req, res) => {
    const { name, identifier, admin_name, admin_email, admin_password, menu_setup, source_shop_id } = req.body;

    if (!name || !identifier || !admin_name || !admin_email || !admin_password) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    const slugRegex = /^[a-z0-9-]{3,50}$/;
    if (!slugRegex.test(identifier)) {
        return res.status(400).json({ success: false, message: 'Slug must be 3-50 lowercase letters, numbers, or hyphens.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [[slugCheck]] = await connection.query('SELECT id FROM shops WHERE identifier = ? OR slug = ? LIMIT 1', [identifier, identifier]);
        if (slugCheck) {
            await connection.rollback();
            return res.status(409).json({ success: false, message: 'Shop identifier already in use.' });
        }

        const shopUuid = generateUuid();
        const [shopResult] = await connection.query(
            `INSERT INTO shops
             (uuid, name, identifier, slug, status, subscription_status, subscription_plan,
              trial_ends_at)
             VALUES (?, ?, ?, ?, 'active', 'trial', 'standard',
              DATE_ADD(CURDATE(), INTERVAL 14 DAY))`,
            [shopUuid, name, identifier, identifier]
        );
        const shopId = shopResult.insertId;

        const hashedPassword = await bcrypt.hash(admin_password, 10);
        const userUuid = generateUuid();
        await connection.query(
            'INSERT INTO users (uuid, name, email, password, role, shop_id, status) VALUES (?, ?, ?, ?, "admin", ?, "active")',
            [userUuid, admin_name, admin_email, hashedPassword, shopId]
        );

        const defaultSettings = [
            ['shop_name', name],
            ['currency_symbol', 'Rs.'],
            ['service_charge_enabled', 'true'],
            ['service_charge_rate', '10'],
            ['kot_enabled', 'true'],
            ['public_menu_enabled', 'true']
        ];
        for (const [key, value] of defaultSettings) {
            await connection.query('INSERT IGNORE INTO settings (setting_key, setting_value, shop_id) VALUES (?, ?, ?)', [key, value, shopId]);
        }
        
        // 5. Menu Setup
        if (menu_setup === 'template') {
            const seedPath = path.join(__dirname, '../seeds/default_menu.json');
            if (fs.existsSync(seedPath)) {
                const defaultMenu = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
                for (const item of defaultMenu) {
                    await connection.query(
                        `INSERT INTO items (uuid, name, category, main_category, price, item_type, send_to_kitchen, show_on_public_menu, shop_id, status, availability_status, stock_qty, track_stock) 
                         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'available', 0, 0)`,
                        [item.name, item.category, item.main_category, item.price, item.item_type, item.send_to_kitchen, item.show_on_public_menu, shopId]
                    );
                }
            }
        } else if (menu_setup === 'copy' && source_shop_id) {
            // Copy items from another shop
            await connection.query(
                `INSERT INTO items (uuid, name, short_code, category, main_category, portion_type, price, portion_label, description, track_stock, stock_qty, send_to_kitchen, item_type, quick_sale_enabled, show_on_public_menu, public_description, image_url, spice_level, is_veg, is_featured, shop_id, status, availability_status)
                 SELECT UUID(), name, short_code, category, main_category, portion_type, price, portion_label, description, 0, 0, send_to_kitchen, item_type, quick_sale_enabled, show_on_public_menu, public_description, image_url, spice_level, is_veg, is_featured, ?, status, availability_status
                 FROM items WHERE shop_id = ?`,
                [shopId, source_shop_id]
            );
            
            // Optionally copy combos too
            await connection.query(
                `INSERT INTO combo_meals (uuid, name, price, status, shop_id)
                 SELECT UUID(), name, price, status, ?
                 FROM combo_meals WHERE shop_id = ?`,
                [shopId, source_shop_id]
            );
        }

        await connection.commit();

        // Audit Log
        await db.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, 'shop_created', 'shop', shopId, `Provisioned shop: ${name} (${identifier})`, req.ip, req.headers['user-agent']]
        );

        res.status(201).json({ success: true, message: 'Shop provisioned' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    } finally {
        connection.release();
    }
};

exports.updateShopStatus = async (req, res) => {
    const { status } = req.body;
    const shopId = req.params.id;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    try {
        const [[oldShop]] = await db.query('SELECT status FROM shops WHERE id = ?', [shopId]);
        await db.query('UPDATE shops SET status = ? WHERE id = ?', [status, shopId]);

        // Audit Log
        await db.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, old_value, new_value, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, 'shop_status_updated', 'shop', shopId, `Updated status to ${status}`, JSON.stringify({status: oldShop.status}), JSON.stringify({status}), req.ip, req.headers['user-agent']]
        );

        res.json({ success: true, message: `Shop status updated to ${status}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getShopUsage = async (req, res) => {
    const shopId = req.params.id;
    try {
        const [[invoices]] = await db.query('SELECT COUNT(*) as count, SUM(grand_total) as total FROM invoices WHERE shop_id = ?', [shopId]);
        const [[items]] = await db.query('SELECT COUNT(*) as count FROM items WHERE shop_id = ?', [shopId]);
        const [[users]] = await db.query('SELECT COUNT(*) as count FROM users WHERE shop_id = ?', [shopId]);
        
        res.json({
            success: true,
            data: {
                invoice_count: invoices.count,
                total_revenue: invoices.total || 0,
                item_count: items.count,
                user_count: users.count
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createShopAdmin = async (req, res) => {
    const { name, email, password } = req.body;
    const shopId = req.params.id;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    try {
        const [[emailCheck]] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (emailCheck) {
            return res.status(409).json({ success: false, message: 'Email already in use.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const uuid = generateUuid();
        await db.query(
            'INSERT INTO users (uuid, name, email, password, role, shop_id, status) VALUES (?, ?, ?, ?, "admin", ?, "active")',
            [uuid, name, email, hashedPassword, shopId]
        );

        // Audit Log
        await db.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, 'shop_admin_created', 'user', null, `Created admin ${email} for shop ${shopId}`, req.ip, req.headers['user-agent']]
        );

        res.status(201).json({ success: true, message: 'Shop admin created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateShop = async (req, res) => {
    const { name, status } = req.body;
    try {
        await db.query('UPDATE shops SET name = ?, status = ? WHERE id = ?', [name, status, req.params.id]);
        res.json({ success: true, message: 'Shop updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── Subscription Management ─────────────────────────────────────────────────

// GET /api/super-admin/shops
exports.getShops = async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = `
            SELECT 
                id, name, slug as identifier, status,
                subscription_status, subscription_plan,
                subscription_end_date, grace_until, trial_ends_at,
                last_payment_date, last_payment_amount, next_billing_date
            FROM shops 
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ` AND (name LIKE ? OR slug LIKE ?)`;
            const s = `%${search}%`;
            params.push(s, s);
        }

        if (status) {
            query += ` AND subscription_status = ?`;
            params.push(status);
        }

        query += ` ORDER BY subscription_end_date ASC, name ASC`;

        const [shops] = await db.query(query, params);
        const enriched = shops.map(shop => ({
            ...shop,
            effective_subscription_status: subscriptionService.resolveEffectiveSubscriptionStatus(shop)
        }));
        res.json({ success: true, data: enriched });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// POST /api/super-admin/subscriptions/:id/mark-paid
exports.recordPayment = async (req, res) => {
    try {
        const result = await subscriptionService.markPaymentReceived(req.params.id, req.body, req.user.id);
        res.json({ success: true, message: 'Payment recorded successfully', data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

// POST /api/super-admin/subscriptions/:id/extend
exports.extendSubscription = async (req, res) => {
    try {
        const result = await subscriptionService.extendSubscription(req.params.id, req.body, req.user.id);
        res.json({ success: true, message: 'Subscription extended', data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

// POST /api/super-admin/subscriptions/:id/grace
exports.giveGrace = async (req, res) => {
    try {
        const result = await subscriptionService.giveGraceDays(req.params.id, req.body, req.user.id);
        res.json({ success: true, message: 'Grace period extended', data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

// POST /api/super-admin/subscriptions/:id/lock
exports.lockShop = async (req, res) => {
    try {
        await subscriptionService.setLockStatus(req.params.id, true, req.body.reason, req.user.id);
        res.json({ success: true, message: 'Shop locked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

// POST /api/super-admin/subscriptions/:id/unlock
exports.unlockShop = async (req, res) => {
    try {
        await subscriptionService.setLockStatus(req.params.id, false, req.body.reason, req.user.id);
        res.json({ success: true, message: 'Shop unlocked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

// POST /api/super-admin/subscriptions/:id/suspend
exports.suspendShop = async (req, res) => {
    try {
        await subscriptionService.suspendShop(req.params.id, req.body.reason, req.user.id);
        res.json({ success: true, message: 'Shop suspended successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

exports.getPaymentHistory = async (req, res) => {
    try {
        const { shop_id, date_from, date_to } = req.query;
        let query = `
            SELECT 
                sp.*, 
                s.name as shop_name,
                u.name as recorded_by_name
            FROM subscription_payments sp
            JOIN shops s ON sp.shop_id = s.id
            LEFT JOIN users u ON sp.recorded_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (shop_id) {
            query += ` AND sp.shop_id = ?`;
            params.push(shop_id);
        }

        if (date_from) {
            query += ` AND sp.created_at >= ?`;
            params.push(date_from);
        }

        if (date_to) {
            query += ` AND sp.created_at <= ?`;
            params.push(date_to + ' 23:59:59');
        }

        query += ` ORDER BY sp.created_at DESC`;

        const [payments] = await db.query(query, params);
        res.json({ success: true, data: payments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getSubscriptionLogs = async (req, res) => {
    try {
        const shopId = req.params.id;
        const [logs] = await db.query(
            `SELECT sl.*, u.name as recorder_name 
             FROM subscription_logs sl 
             LEFT JOIN users u ON sl.recorded_by = u.id 
             WHERE sl.shop_id = ? ORDER BY sl.created_at DESC`,
            [shopId]
        );
        res.json({ success: true, data: logs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/super-admin/audit-logs
exports.getAuditLogs = async (req, res) => {
    try {
        const { action, entity_type, search, date_from, date_to, page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        let query = `
            SELECT 
                al.*, 
                u.name as user_name, 
                s.name as shop_name 
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            LEFT JOIN shops s ON al.shop_id = s.id
            WHERE 1=1
        `;
        const params = [];

        if (action) {
            query += ` AND al.action = ?`;
            params.push(action);
        }

        if (entity_type) {
            query += ` AND al.entity_type = ?`;
            params.push(entity_type);
        }

        if (date_from) {
            query += ` AND al.created_at >= ?`;
            params.push(date_from);
        }

        if (date_to) {
            query += ` AND al.created_at <= ?`;
            params.push(date_to + ' 23:59:59');
        }

        if (search) {
            query += ` AND (al.action LIKE ? OR al.entity_type LIKE ? OR u.name LIKE ? OR s.name LIKE ? OR al.details LIKE ?)`;
            const s = `%${search}%`;
            params.push(s, s, s, s, s);
        }

        // Count total
        const [totalRows] = await db.query(`SELECT COUNT(*) as count FROM (${query}) as sub`, params);
        
        // Final query with limit/offset
        query += ` ORDER BY al.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), offset);

        const [logs] = await db.query(query, params);

        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    total: totalRows[0].count,
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('[getAuditLogs]', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/super-admin/shops/:id/subscription-logs
exports.getSubscriptionLogs = async (req, res) => {
    try {
        const [logs] = await db.query(
            `SELECT sl.*, u.name as performed_by_name
             FROM subscription_logs sl
             LEFT JOIN users u ON sl.performed_by = u.id
             WHERE sl.shop_id = ?
             ORDER BY sl.created_at DESC
             LIMIT 50`,
            [req.params.id]
        );
        res.json({ success: true, data: logs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── System Health ────────────────────────────────────────────────────────────

// ─── Platform Users ─────────────────────────────────────────────────────────

exports.getPlatformUsers = async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT u.id, u.uuid, u.name, u.email, u.role, u.status, u.created_at, s.name as shop_name
            FROM users u
            LEFT JOIN shops s ON u.shop_id = s.id
            ORDER BY u.created_at DESC
        `);
        res.json({ success: true, data: users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createPlatformUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    try {
        const [[existing]] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing) return res.status(409).json({ success: false, message: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const uuid = generateUuid();
        await db.query(
            'INSERT INTO users (uuid, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, "active")',
            [uuid, name, email, hashedPassword, role]
        );

        // Audit Log
        await db.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, 'platform_user_created', 'user', null, `Created platform user ${email} with role ${role}`, req.ip, req.headers['user-agent']]
        );

        res.status(201).json({ success: true, message: 'User created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateUserStatus = async (req, res) => {
    const { status } = req.body;
    const userId = req.params.id;
    try {
        await db.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
        
        // Audit Log
        await db.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, 'user_status_updated', 'user', userId, `Updated user ${userId} status to ${status}`, req.ip, req.headers['user-agent']]
        );

        res.json({ success: true, message: 'User status updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.resetUserPassword = async (req, res) => {
    const { password } = req.body;
    const userId = req.params.id;
    if (!password) return res.status(400).json({ success: false, message: 'Password required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        // Audit Log
        await db.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, 'user_password_reset', 'user', userId, `Reset password for user ${userId}`, req.ip, req.headers['user-agent']]
        );

        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const localBackupService = require('../services/localBackupService');

// ─── Backups ────────────────────────────────────────────────────────────────

exports.getBackups = async (req, res) => {
    try {
        const [backups] = await db.query('SELECT * FROM backup_logs ORDER BY created_at DESC LIMIT 100');
        res.json({ success: true, data: backups });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.runBackup = async (req, res) => {
    try {
        const result = await localBackupService.createDatabaseBackup(req.user.id, 'manual');
        
        // Audit Log
        await db.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, 'backup_run', 'system', result.uuid, `Manually triggered backup: ${result.fileName} (${result.sizeMb} MB)`, req.ip, req.headers['user-agent']]
        );

        res.json({ success: true, message: 'Backup completed successfully', data: result });
    } catch (error) {
        console.error('Manual Backup Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Backup failed' });
    }
};


// ─── Platform Settings ──────────────────────────────────────────────────────

exports.getPlatformSettings = async (req, res) => {
    try {
        const [settings] = await db.query('SELECT * FROM platform_settings');
        const formatted = settings.reduce((acc, curr) => {
            acc[curr.setting_key] = curr.setting_value;
            return acc;
        }, {});
        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updatePlatformSettings = async (req, res) => {
    const settings = req.body; // Expecting { key: value, ... }
    try {
        for (const [key, value] of Object.entries(settings)) {
            await db.query(
                'INSERT INTO platform_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                [key, value, value]
            );
        }

        // Audit Log
        await db.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, 'platform_settings_updated', 'system', null, 'Updated platform settings', req.ip, req.headers['user-agent']]
        );

        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── Shop Menu Management (Super Admin) ───────────────────────────────────

/**
 * GET /api/super-admin/shops/:id/menu
 */
exports.getShopMenu = async (req, res) => {
    try {
        const shopId = req.params.id;
        const [items] = await db.query(
            'SELECT * FROM items WHERE shop_id = ? ORDER BY category ASC, name ASC',
            [shopId]
        );
        res.json({ success: true, data: items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * POST /api/super-admin/shops/:id/menu/clone
 * Clones menu from a template or another shop
 */
exports.cloneShopMenu = async (req, res) => {
    const { source_type, source_id } = req.body; // source_type: 'template' or 'shop'
    const targetShopId = req.params.id;

    if (!source_type || !source_id) {
        return res.status(400).json({ success: false, message: 'Source type and ID are required.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Verify target shop exists
        const [[targetShop]] = await connection.query('SELECT id, name FROM shops WHERE id = ?', [targetShopId]);
        if (!targetShop) throw new Error('Target shop not found');

        if (source_type === 'template') {
            const seedPath = path.join(__dirname, '../seeds/default_menu.json');
            if (!fs.existsSync(seedPath)) throw new Error('Default menu template not found');
            
            const defaultMenu = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
            for (const item of defaultMenu) {
                await connection.query(
                    `INSERT INTO items (uuid, name, category, main_category, price, item_type, send_to_kitchen, show_on_public_menu, shop_id, status, availability_status, stock_qty, track_stock) 
                     VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'available', 0, 0)`,
                    [item.name, item.category, item.main_category, item.price, item.item_type, item.send_to_kitchen, item.show_on_public_menu, targetShopId]
                );
            }
        } else if (source_type === 'shop') {
            // Verify source shop exists
            const [[sourceShop]] = await connection.query('SELECT id FROM shops WHERE id = ?', [source_id]);
            if (!sourceShop) throw new Error('Source shop not found');

            await connection.query(
                `INSERT INTO items (uuid, name, short_code, category, main_category, portion_type, price, portion_label, description, track_stock, stock_qty, send_to_kitchen, item_type, quick_sale_enabled, show_on_public_menu, public_description, image_url, spice_level, is_veg, is_featured, shop_id, status, availability_status)
                 SELECT UUID(), name, short_code, category, main_category, portion_type, price, portion_label, description, 0, 0, send_to_kitchen, item_type, quick_sale_enabled, show_on_public_menu, public_description, image_url, spice_level, is_veg, is_featured, ?, status, availability_status
                 FROM items WHERE shop_id = ?`,
                [targetShopId, source_id]
            );

            await connection.query(
                `INSERT INTO combo_meals (uuid, name, price, status, shop_id)
                 SELECT UUID(), name, price, status, ?
                 FROM combo_meals WHERE shop_id = ?`,
                [targetShopId, source_id]
            );
        }

        await connection.commit();

        // Audit Log
        await db.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, 'shop_menu_cloned', 'shop', targetShopId, `Cloned menu from ${source_type} ${source_id} to ${targetShop.name}`, req.ip, req.headers['user-agent']]
        );

        res.json({ success: true, message: 'Menu cloned successfully' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    } finally {
        connection.release();
    }
};

exports.getHealth = async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({
            success: true,
            data: {
                database: 'connected',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date()
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'System unhealthy', error: error.message });
    }
};
