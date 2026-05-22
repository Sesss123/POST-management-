const fs = require('fs');
const path = require('path');
const os = require('os');
const { db } = require('../config/db');
const { generateUuid } = require('../utils/identifier');
const bcrypt = require('bcryptjs');
const subscriptionService = require('../services/subscriptionService');
const platformSettingsService = require('../services/platformSettingsService');

// getSystemHealth and getHealth removed. Using systemHealthController instead.

// ─── Platform Stats ─────────────────────────────────────────────────────────

exports.getStats = async (req, res) => {
    try {
        const [shopsCount] = await db.query('SELECT COUNT(*) as count FROM shops');
        const [usersCount] = await db.query('SELECT COUNT(*) as count FROM users');
        const [revenue] = await db.query('SELECT SUM(grand_total) as total FROM invoices WHERE payment_status != "cancelled"');
        const [recentShops] = await db.query('SELECT id, name, identifier, status, subscription_status, created_at FROM shops ORDER BY created_at DESC LIMIT 5');

        // New shops trends
        const [[newShopsThisMonth]] = await db.query('SELECT COUNT(*) as count FROM shops WHERE created_at >= DATE_FORMAT(CURDATE(), "%Y-%m-01")');
        const [[newShopsLastMonth]] = await db.query(`
            SELECT COUNT(*) as count FROM shops 
            WHERE created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), "%Y-%m-01") 
            AND created_at < DATE_FORMAT(CURDATE(), "%Y-%m-01")
        `);
        
        // Revenue trends (from subscription payments)
        const [[revThisMonth]] = await db.query('SELECT SUM(amount) as total FROM subscription_payments WHERE created_at >= DATE_FORMAT(CURDATE(), "%Y-%m-01")');
        const [[revLastMonth]] = await db.query(`
            SELECT SUM(amount) as total FROM subscription_payments 
            WHERE created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), "%Y-%m-01") 
            AND created_at < DATE_FORMAT(CURDATE(), "%Y-%m-01")
        `);

        // Security telemetry (last 24h)
        const [[securityStats]] = await db.query(`
            SELECT 
                SUM(action = 'login_failed') as failed_logins,
                SUM(action = 'unauthorized_access') as unauthorized_attempts
            FROM audit_logs 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `);

        // Subscription health
        const [[subStats]] = await db.query(`
            SELECT 
                SUM(subscription_status = 'active') as active_count,
                SUM(subscription_status = 'grace') as grace_count,
                SUM(subscription_status = 'restricted') as restricted_count,
                SUM(subscription_status = 'locked') as locked_count
            FROM shops
        `);

        // Basic Server Health
        const localBackupService = require('../services/localBackupService');
        const backupStorageMb = await localBackupService.getTotalStorageUsed();
        
        const memRaw = process.memoryUsage();
        const serverHealth = {
            status: 'online',
            uptime_seconds: Math.floor(process.uptime()),
            memory_used_mb: Math.round(memRaw.rss / 1024 / 1024),
            memory_total_mb: Math.round(os.totalmem() / 1024 / 1024),
            db_status: 'connected',
            backup_storage_mb: backupStorageMb
        };

        res.json({
            success: true,
            data: {
                shops: {
                    total: shopsCount[0].count,
                    new_this_month: newShopsThisMonth.count || 0,
                    new_last_month: newShopsLastMonth.count || 0,
                    growth_delta: (newShopsThisMonth.count || 0) - (newShopsLastMonth.count || 0)
                },
                users_count: usersCount[0].count,
                total_platform_revenue: revenue[0].total || 0,
                revenue_trends: {
                    this_month: parseFloat(revThisMonth.total) || 0,
                    last_month: parseFloat(revLastMonth.total) || 0,
                    delta: (parseFloat(revThisMonth.total) || 0) - (parseFloat(revLastMonth.total) || 0)
                },
                security: {
                    failed_logins_24h: securityStats.failed_logins || 0,
                    unauthorized_attempts_24h: securityStats.unauthorized_attempts || 0
                },
                recent_shops: recentShops,
                subscription_health: subStats,
                server_health: serverHealth
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
        const mrrValue = (mrrRow && mrrRow.mrr) ? mrrRow.mrr : 0;
        const totalShops = healthRow ? healthRow.total : 0;
        const activeShops = healthRow ? healthRow.active : 0;
        const healthScore = totalShops > 0 ? (activeShops / totalShops) * 100 : 0;

        res.json({
            success: true,
            data: {
                status_distribution: statusDist || [],
                mrr: mrrValue,
                payment_trend: paymentTrend || [],
                shop_trend: shopTrend || [],
                top_shops: topShops || [],
                health_score: Math.round(healthScore),
                total_shops: totalShops,
                active_shops: activeShops
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
            effective_subscription_status: subscriptionService.resolveEffectiveSubscriptionStatus(shop)
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
        shop.effective_subscription_status = subscriptionService.resolveEffectiveSubscriptionStatus(shop);

        // Ensure default staff users exist (Cashier and Kitchen)
        await ensureDefaultStaffUsers(db, shop.id, shop.slug || shop.identifier, shop.name, shop.temp_password);

        // Retrieve all users for the credentials modal
        const [users] = await db.query(
            'SELECT name, email, role, temp_password FROM users WHERE shop_id = ? AND role != "super_admin"',
            [shop.id]
        );
        shop.users = users;

        res.json({ success: true, data: shop });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const ensureDefaultStaffUsers = async (dbOrConn, shopId, identifier, shopName, tempPassword) => {
    const activeTempPassword = tempPassword || 'password';

    // 1. Check if cashier exists for this shop
    const [[cashierExists]] = await dbOrConn.query(
        'SELECT id FROM users WHERE shop_id = ? AND role = "cashier" LIMIT 1',
        [shopId]
    );

    if (!cashierExists) {
        const cashierEmail = `cashier@${identifier}.com`;
        const [[emailCheck]] = await dbOrConn.query('SELECT id FROM users WHERE email = ? LIMIT 1', [cashierEmail]);
        if (!emailCheck) {
            const cashierUuid = generateUuid();
            const cashierHashedPassword = await bcrypt.hash(activeTempPassword, 10);
            await dbOrConn.query(
                'INSERT INTO users (uuid, name, email, password, role, shop_id, status, temp_password) VALUES (?, ?, ?, ?, "cashier", ?, "active", ?)',
                [cashierUuid, `${shopName} Cashier`, cashierEmail, cashierHashedPassword, shopId, activeTempPassword]
            );
        }
    }

    // 2. Check if kitchen exists for this shop
    const [[kitchenExists]] = await dbOrConn.query(
        'SELECT id FROM users WHERE shop_id = ? AND role = "kitchen" LIMIT 1',
        [shopId]
    );

    if (!kitchenExists) {
        const kitchenEmail = `kitchen@${identifier}.com`;
        const [[emailCheck]] = await dbOrConn.query('SELECT id FROM users WHERE email = ? LIMIT 1', [kitchenEmail]);
        if (!emailCheck) {
            const kitchenUuid = generateUuid();
            const kitchenHashedPassword = await bcrypt.hash(activeTempPassword, 10);
            await dbOrConn.query(
                'INSERT INTO users (uuid, name, email, password, role, shop_id, status, temp_password) VALUES (?, ?, ?, ?, "kitchen", ?, "active", ?)',
                [kitchenUuid, `${shopName} Kitchen`, kitchenEmail, kitchenHashedPassword, shopId, activeTempPassword]
            );
        }
    }
};

exports.createShop = async (req, res) => {
    const { 
        name, identifier, admin_name, admin_email, admin_password, 
        menu_setup, source_shop_id, 
        shop_email, shop_phone, shop_address 
    } = req.body;

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
             (uuid, name, identifier, slug, email, phone, address, status, subscription_status, subscription_plan,
              trial_ends_at, temp_password)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 'trial', 'standard',
              DATE_ADD(CURDATE(), INTERVAL ? DAY), ?)`,
            [
                shopUuid, name, identifier, identifier, 
                shop_email || null, shop_phone || null, shop_address || null,
                platformSettingsService.getInt('trial_days', 14),
                admin_password
            ]
        );
        const shopId = shopResult.insertId;

        const hashedPassword = await bcrypt.hash(admin_password, 10);
        const userUuid = generateUuid();
        await connection.query(
            'INSERT INTO users (uuid, name, email, password, role, shop_id, status, temp_password) VALUES (?, ?, ?, ?, "admin", ?, "active", ?)',
            [userUuid, admin_name, admin_email, hashedPassword, shopId, admin_password]
        );

        // Ensure default staff users exist (Cashier and Kitchen)
        await ensureDefaultStaffUsers(connection, shopId, identifier, name, admin_password);

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

        res.status(201).json({ 
            success: true, 
            message: 'Shop provisioned',
            data: {
                shopId: shopId,
                admin_email: admin_email,
                admin_password: admin_password,
                cashier_email: `cashier@${identifier}.com`,
                cashier_password: admin_password,
                kitchen_email: `kitchen@${identifier}.com`,
                kitchen_password: admin_password
            }
        });
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
            'INSERT INTO users (uuid, name, email, password, role, shop_id, status, temp_password) VALUES (?, ?, ?, ?, "admin", ?, "active", ?)',
            [uuid, name, email, hashedPassword, shopId, password]
        );

        // Get shop name for welcome email
        const [[shop]] = await db.query('SELECT name FROM shops WHERE id = ?', [shopId]);

        // Send Welcome Email
        const notificationService = require('../services/notificationService');
        await notificationService.sendWelcomeEmail(email, shop.name, name);

        res.status(201).json({ success: true, message: 'Shop admin created and Welcome Email sent.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateShop = async (req, res) => {
    const { name, status, email, phone, address } = req.body;
    try {
        await db.query(
            'UPDATE shops SET name = ?, status = ?, email = ?, phone = ?, address = ? WHERE id = ?', 
            [name, status, email, phone, address, req.params.id]
        );
        res.json({ success: true, message: 'Shop updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteShop = async (req, res) => {
    const shopId = req.params.id;
    const connection = await db.getConnection();
    try {
        // Retrieve shop name first for logging/auditing
        const [[shop]] = await connection.query('SELECT name, slug FROM shops WHERE id = ?', [shopId]);
        if (!shop) {
            connection.release();
            return res.status(404).json({ success: false, message: 'Shop not found' });
        }

        await connection.beginTransaction();

        // 1. Disable foreign key checks to prevent cascade order failures
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // 2. Query all tables in the database
        const [tables] = await connection.query('SHOW TABLES');
        const dbName = process.env.DB_NAME || 'restoledgerdb';
        const tableKey = `Tables_in_${dbName}`;

        const excludedTables = [
            'shops',
            'subscription_plans',
            'platform_settings',
            'broadcast_announcements',
            'broadcasts'
        ];

        // 3. For each table, if it contains shop_id, delete records for this shop
        for (const row of tables) {
            const tableName = row[tableKey] || Object.values(row)[0];
            if (excludedTables.includes(tableName)) continue;

            const [columns] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\` LIKE 'shop_id'`);
            if (columns.length > 0) {
                await connection.query(`DELETE FROM \`${tableName}\` WHERE shop_id = ?`, [shopId]);
            }
        }

        // 4. Delete the shop row itself
        await connection.query('DELETE FROM shops WHERE id = ?', [shopId]);

        // 5. Re-enable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        await connection.commit();

        // 6. Record in global audit logs (audit_logs is a platform table but scoped by shop_id,
        // so we write this entry post-deletion using the global db object)
        await db.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, 'shop_deleted', 'shop', shopId, `Purged shop: ${shop.name} (${shop.slug})`, req.ip, req.headers['user-agent']]
        );

        res.json({ success: true, message: `Shop "${shop.name}" and all associated data have been permanently deleted.` });
    } catch (error) {
        try {
            await connection.query('SET FOREIGN_KEY_CHECKS = 1');
            await connection.rollback();
        } catch (rollbackError) {
            console.error('Rollback failed:', rollbackError);
        }
        console.error('[deleteShop]', error);
        res.status(500).json({ success: false, message: 'Server error occurred during deletion.' });
    } finally {
        connection.release();
    }
};

exports.updateDeliveryPermission = async (req, res) => {
    const { enabled } = req.body;
    try {
        await db.query('UPDATE shops SET has_delivery_orders = ? WHERE id = ?', [enabled ? 1 : 0, req.params.id]);
        res.json({ success: true, message: `Delivery permission ${enabled ? 'enabled' : 'disabled'}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateFeaturePermission = async (req, res) => {
    const { feature, enabled, isModule, isBatch, permissions } = req.body;
    const allowedLegacy = ['has_delivery_orders', 'has_marketing_center', 'has_quick_retail'];
    
    try {
        if (isBatch && permissions) {
            await db.query('UPDATE shops SET module_permissions = ? WHERE id = ?', [JSON.stringify(permissions), req.params.id]);
        } else if (isModule) {
            const [[shop]] = await db.query('SELECT module_permissions FROM shops WHERE id = ?', [req.params.id]);
            let perms = {};
            if (shop.module_permissions) {
                perms = typeof shop.module_permissions === 'string' ? JSON.parse(shop.module_permissions) : shop.module_permissions;
            }
            perms[feature] = enabled;
            await db.query('UPDATE shops SET module_permissions = ? WHERE id = ?', [JSON.stringify(perms), req.params.id]);
        } else {
            if (!allowedLegacy.includes(feature)) {
                return res.status(400).json({ success: false, message: 'Invalid legacy feature key' });
            }
            await db.query(`UPDATE shops SET ${feature} = ? WHERE id = ?`, [enabled ? 1 : 0, req.params.id]);
        }
        res.json({ success: true, message: `Permission updated successfully` });
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
                last_payment_date, last_payment_amount, next_billing_date,
                has_delivery_orders, has_marketing_center, has_quick_retail,
                module_permissions
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

        // Send Receipt Email
        try {
            const [[shopInfo]] = await db.query(`
                SELECT s.name, u.email, s.subscription_plan, s.subscription_end_date 
                FROM shops s 
                JOIN users u ON s.id = u.shop_id 
                WHERE s.id = ? AND u.role = 'admin'
            `, [req.params.id]);

            if (shopInfo) {
                const notificationService = require('../services/notificationService');
                await notificationService.sendPaymentReceipt(
                    shopInfo.email,
                    shopInfo.name,
                    req.body.amount,
                    shopInfo.subscription_plan,
                    shopInfo.subscription_end_date
                );
            }
        } catch (emailErr) {
            console.error('Failed to send receipt email:', emailErr);
        }

        res.json({ success: true, message: 'Payment recorded and Receipt Email sent.', data: result });
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
            SELECT u.id, u.uuid, u.name, u.email, u.role, u.status, u.created_at, u.temp_password, s.name as shop_name
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
            'INSERT INTO users (uuid, name, email, password, role, status, temp_password) VALUES (?, ?, ?, ?, ?, "active", ?)',
            [uuid, name, email, hashedPassword, role, password]
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
        await db.query('UPDATE users SET password = ?, temp_password = ? WHERE id = ?', [hashedPassword, password, userId]);

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

        // Refresh security cache & platform settings
        const securitySettingsService = require('../services/securitySettingsService');
        const notificationService = require('../services/notificationService');
        await securitySettingsService.refresh();
        await platformSettingsService.refresh();
        await notificationService.refresh();

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

// getHealth removed. using systemHealthController.getSystemHealth

/**
 * GET /api/super-admin/security
 * Returns real security metrics, rate limiting status, and suspicious activity logs.
 */
exports.getSecurityMetrics = async (req, res) => {
    try {
        const interval = '1 DAY';

        // 1. Rate Limit Configuration (Real-time from service)
        const securitySettingsService = require('../services/securitySettingsService');
        const rateLimits = {
            auth: { enabled: true, limit: securitySettingsService.get('security_auth_limit') || 10, window_minutes: 15 },
            general_api: { enabled: true, limit: securitySettingsService.get('security_general_limit') || 1000, window_minutes: 15 },
            public_menu: { enabled: true, limit: securitySettingsService.get('security_public_limit') || 300, window_minutes: 15 },
            payment_status: { enabled: true, limit: securitySettingsService.get('security_payment_limit') || 120, window_minutes: 5 },
            super_admin: { enabled: true, limit: securitySettingsService.get('security_super_admin_limit') || 300, window_minutes: 15 }
        };

        // 2. Security Event Counts (Last 24h)
        const [[failedLogins]] = await db.query(
            `SELECT COUNT(*) as count FROM audit_logs WHERE action = 'login_failed' AND created_at >= NOW() - INTERVAL ${interval}`
        );
        const [[unauthorized]] = await db.query(
            `SELECT COUNT(*) as count FROM audit_logs WHERE action = 'unauthorized_access_attempt' AND created_at >= NOW() - INTERVAL ${interval}`
        );
        const [[rateLimited]] = await db.query(
            `SELECT COUNT(*) as count FROM audit_logs WHERE action LIKE 'rate_limit%' AND created_at >= NOW() - INTERVAL ${interval}`
        );
        const [[forbidden]] = await db.query(
            `SELECT COUNT(*) as count FROM audit_logs WHERE action = 'forbidden_api_attempt' AND created_at >= NOW() - INTERVAL ${interval}`
        );

        // 3. Top Suspicious IPs (Last 24h)
        const [suspiciousIps] = await db.query(`
            SELECT 
                ip_address, 
                COUNT(*) as event_count, 
                MAX(created_at) as last_seen,
                CASE 
                    WHEN COUNT(*) > 50 THEN 'CRITICAL'
                    WHEN COUNT(*) > 20 THEN 'HIGH'
                    WHEN COUNT(*) > 10 THEN 'MEDIUM'
                    ELSE 'LOW'
                END as risk_level
            FROM audit_logs
            WHERE (action = 'login_failed' OR action LIKE 'rate_limit%' OR action = 'unauthorized_access_attempt')
            AND created_at >= NOW() - INTERVAL ${interval}
            GROUP BY ip_address
            ORDER BY event_count DESC
            LIMIT 10
        `);

        // 4. Recent Security Logs
        const [recentLogs] = await db.query(`
            SELECT 
                al.*, 
                u.name as user_name, 
                s.name as shop_name 
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            LEFT JOIN shops s ON al.shop_id = s.id
            WHERE al.entity_type = 'security' OR al.action LIKE 'rate_limit%' OR al.action IN ('login_failed', 'unauthorized_access_attempt', 'forbidden_api_attempt')
            ORDER BY al.created_at DESC
            LIMIT 20
        `);

        res.json({
            success: true,
            data: {
                rate_limits: rateLimits,
                security_events: {
                    failed_logins_24h: failedLogins.count,
                    unauthorized_attempts_24h: unauthorized.count,
                    rate_limited_requests_24h: rateLimited.count,
                    forbidden_requests_24h: forbidden.count
                },
                top_suspicious_ips: suspiciousIps,
                recent_security_logs: recentLogs
            }
        });
    } catch (error) {
        console.error('[getSecurityMetrics]', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

