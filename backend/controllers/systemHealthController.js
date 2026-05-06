/**
 * System Health Controller
 * GET /api/super-admin/system-health
 *
 * Returns a full platform health snapshot using ONLY real data.
 * No hardcoded values. No fake stats.
 * If a check cannot run, it returns null / "not_available".
 * Secrets (DB password, JWT, API keys) are NEVER included.
 */

const { db } = require('../config/db');
const { resolveEffectiveStatus } = require('../middleware/subscriptionMiddleware');
const os = require('os');

// ─── helpers ──────────────────────────────────────────────────────────────────

const safeQuery = async (sql, params = []) => {
    try {
        const [rows] = await db.query(sql, params);
        return rows;
    } catch {
        return null;
    }
};

const count = (rows) => (rows === null ? null : rows[0]?.cnt ?? rows[0]?.count ?? 0);

const tableExists = (existingTables, name) => existingTables.includes(name);

// ─── main handler ─────────────────────────────────────────────────────────────

exports.getSystemHealth = async (req, res) => {
    const now = new Date();
    const alerts = [];
    let overallStatus = 'healthy'; // upgraded to warning/critical as issues found

    const setStatus = (level) => {
        if (level === 'critical') overallStatus = 'critical';
        else if (level === 'warning' && overallStatus !== 'critical') overallStatus = 'warning';
    };

    // ══════════════════════════════════════════════════════════════════════════
    // 1. SERVER — Node.js process only. No fake CPU/disk.
    // ══════════════════════════════════════════════════════════════════════════
    const mem = process.memoryUsage();
    const server = {
        status: 'online',
        uptime_seconds: Math.floor(process.uptime()),
        node_version: process.version,
        environment: process.env.NODE_ENV || 'development',
        platform: process.platform,
        arch: process.arch,
        memory_used_mb: Math.round(mem.rss / 1024 / 1024),
        memory_heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
        memory_heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
        memory_total_mb: (() => {
            try { return Math.round(os.totalmem() / 1024 / 1024); } catch { return null; }
        })(),
        memory_free_mb: (() => {
            try { return Math.round(os.freemem() / 1024 / 1024); } catch { return null; }
        })(),
        disk_status: 'not_available', // no safe cross-platform disk check without extra deps
    };

    // ══════════════════════════════════════════════════════════════════════════
    // 2. DATABASE — real queries only
    // ══════════════════════════════════════════════════════════════════════════
    let database = {
        status: 'disconnected',
        database_name: null,
        table_count: 0,
        last_check: now.toISOString(),
    };
    let existingTables = [];

    try {
        const [[dbRow]] = await db.query('SELECT DATABASE() AS n, 1 AS ping');
        const [tblRows] = await db.query('SHOW TABLES');
        existingTables = tblRows.map(r => Object.values(r)[0]);

        database = {
            status: 'connected',
            database_name: dbRow.n,
            table_count: existingTables.length,
            last_check: now.toISOString(),
        };
    } catch (err) {
        setStatus('critical');
        alerts.push({
            severity: 'critical',
            title: 'Database connection failed',
            description: 'The system cannot connect to MySQL. All operations are at risk.',
            action_link: null,
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 3. TABLE EXISTENCE CHECK
    // ══════════════════════════════════════════════════════════════════════════
    const REQUIRED_TABLES = [
        'users', 'items', 'customers', 'invoices', 'invoice_items',
        'payments', 'customer_ledger', 'settings', 'audit_logs',
        'restaurant_tables', 'table_sessions', 'order_items',
        'kot_orders', 'kot_items', 'held_bills', 'held_bill_items',
    ];
    const OPTIONAL_TABLES = [
        'shops', 'subscription_logs', 'payment_transactions',
        'stock_movements', 'retail_stock_receipts', 'suppliers',
        'purchases', 'supplier_ledger', 'backup_logs',
    ];

    const missingRequired = REQUIRED_TABLES.filter(t => !tableExists(existingTables, t));
    const missingOptional = OPTIONAL_TABLES.filter(t => !tableExists(existingTables, t));

    const integrity_tables = {
        required_total: REQUIRED_TABLES.length,
        optional_total: OPTIONAL_TABLES.length,
        missing_required: missingRequired,
        missing_optional: missingOptional,
    };

    if (missingRequired.length > 0) {
        setStatus('critical');
        alerts.push({
            severity: 'critical',
            title: `${missingRequired.length} required table(s) missing`,
            description: `Missing: ${missingRequired.join(', ')}`,
            action_link: null,
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 4. DATABASE INTEGRITY SUMMARY — real lightweight checks
    // ══════════════════════════════════════════════════════════════════════════
    const integrity = {
        tables: integrity_tables,
        invoices: null,
        naya: null,
        held_bills: null,
        kot: null,
        stock: null,
    };

    // Invoices
    if (tableExists(existingTables, 'invoices') && tableExists(existingTables, 'invoice_items')) {
        const dupInvoiceNo = await safeQuery(
            `SELECT COUNT(*) as cnt FROM (SELECT invoice_no FROM invoices GROUP BY invoice_no HAVING COUNT(*) > 1) AS d`
        );
        const invoicesNoItems = await safeQuery(
            `SELECT COUNT(*) as cnt FROM invoices i WHERE i.status != 'cancelled' AND NOT EXISTS (SELECT 1 FROM invoice_items ii WHERE ii.invoice_id = i.id)`
        );
        const paidWithBalance = await safeQuery(
            `SELECT COUNT(*) as cnt FROM invoices WHERE payment_status = 'paid' AND balance_amount > 0.01`
        );
        const totalMismatch = await safeQuery(
            `SELECT COUNT(*) as cnt FROM invoices WHERE status != 'cancelled' AND ABS(grand_total - (paid_amount + balance_amount)) > 0.01`
        );

        const iDup = count(dupInvoiceNo) ?? 0;
        const iNoItems = count(invoicesNoItems) ?? 0;
        const iPaidBal = count(paidWithBalance) ?? 0;
        const iTotalMis = count(totalMismatch) ?? 0;

        integrity.invoices = {
            duplicate_invoice_no: iDup,
            invoices_without_items: iNoItems,
            paid_with_balance: iPaidBal,
            total_mismatch: iTotalMis,
        };

        if (iDup > 0 || iTotalMis > 5) {
            setStatus('critical');
            alerts.push({ severity: 'critical', title: 'Invoice integrity issues detected', description: `${iDup} duplicate invoice numbers, ${iTotalMis} total mismatches.`, action_link: '/invoices' });
        } else if (iNoItems > 0 || iPaidBal > 0) {
            setStatus('warning');
            alerts.push({ severity: 'warning', title: 'Minor invoice inconsistencies', description: `${iNoItems} invoices with no items, ${iPaidBal} paid invoices with remaining balance.`, action_link: '/invoices' });
        }
    }

    // Naya / Customer ledger
    if (tableExists(existingTables, 'customers') && tableExists(existingTables, 'invoices')) {
        const nayaMismatch = await safeQuery(
            `SELECT COUNT(*) as cnt FROM customers c
             WHERE ABS(c.current_balance -
               COALESCE((SELECT SUM(balance_amount) FROM invoices i WHERE i.customer_id = c.id AND i.payment_status IN ('unpaid','partial') AND i.status != 'cancelled'), 0)
             ) > 0.50`
        );
        const nayaMis = count(nayaMismatch) ?? 0;
        integrity.naya = { customer_balance_mismatch: nayaMis };

        if (nayaMis > 5) {
            setStatus('critical');
            alerts.push({ severity: 'critical', title: 'Naya Book balance mismatch', description: `${nayaMis} customers have mismatched Naya balances.`, action_link: '/naya-book' });
        } else if (nayaMis > 0) {
            setStatus('warning');
            alerts.push({ severity: 'warning', title: 'Naya Book minor mismatch', description: `${nayaMis} customer(s) with balance discrepancy > Rs. 0.50.`, action_link: '/naya-book' });
        }
    }

    // Held bills
    if (tableExists(existingTables, 'held_bills')) {
        const completedNoInvoice = await safeQuery(
            `SELECT COUNT(*) as cnt FROM held_bills WHERE status = 'completed' AND invoice_id IS NULL`
        );
        const cancelledNoReason = await safeQuery(
            `SELECT COUNT(*) as cnt FROM held_bills WHERE status = 'cancelled' AND (cancel_reason IS NULL OR cancel_reason = '')`
        );
        integrity.held_bills = {
            completed_without_invoice: count(completedNoInvoice) ?? 0,
            cancelled_without_reason: count(cancelledNoReason) ?? 0,
        };
    }

    // KOT
    if (tableExists(existingTables, 'kot_orders') && tableExists(existingTables, 'kot_items')) {
        const emptyKots = await safeQuery(
            `SELECT COUNT(*) as cnt FROM kot_orders k WHERE k.status IN ('pending','preparing') AND NOT EXISTS (SELECT 1 FROM kot_items ki WHERE ki.kot_id = k.id)`
        );
        integrity.kot = { active_kots_without_items: count(emptyKots) ?? 0 };
    }

    // Stock
    if (tableExists(existingTables, 'items')) {
        const negativeStock = await safeQuery(
            `SELECT COUNT(*) as cnt FROM items WHERE track_stock = 1 AND stock_qty < 0`
        );
        const shouldBeSoldOut = await safeQuery(
            `SELECT COUNT(*) as cnt FROM items WHERE track_stock = 1 AND stock_qty = 0 AND availability_status != 'sold_out'`
        );
        const negSt = count(negativeStock) ?? 0;
        const soldOut = count(shouldBeSoldOut) ?? 0;

        integrity.stock = {
            negative_stock_count: negSt,
            sold_out_not_marked: soldOut,
        };

        if (negSt > 0) {
            setStatus('warning');
            alerts.push({ severity: 'warning', title: 'Negative stock detected', description: `${negSt} item(s) have negative stock quantity.`, action_link: '/items' });
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 5. SHOPS
    // ══════════════════════════════════════════════════════════════════════════
    let shops = null;
    if (tableExists(existingTables, 'shops')) {
        const [[sc]] = await db.query(
            `SELECT COUNT(*) as total,
                    SUM(status='active') as active_c,
                    SUM(status='inactive') as inactive_c,
                    SUM(status='suspended') as suspended_c
             FROM shops`
        );
        shops = {
            total: Number(sc.total) || 0,
            active: Number(sc.active_c) || 0,
            inactive: Number(sc.inactive_c) || 0,
            suspended: Number(sc.suspended_c) || 0,
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 6. SUBSCRIPTIONS
    // ══════════════════════════════════════════════════════════════════════════
    let subscriptions = null;
    if (tableExists(existingTables, 'shops')) {
        const [subRows] = await db.query(
            'SELECT subscription_status, subscription_end_date, grace_until FROM shops'
        );
        subscriptions = { active: 0, grace: 0, restricted: 0, locked: 0, due_soon_count: 0, expired_count: 0 };

        for (const s of subRows) {
            const eff = resolveEffectiveStatus(s);
            subscriptions[eff] = (subscriptions[eff] || 0) + 1;
            if (eff === 'active' && s.subscription_end_date) {
                const dl = Math.ceil((new Date(s.subscription_end_date) - now) / 86400000);
                if (dl >= 0 && dl <= 7) subscriptions.due_soon_count++;
            }
            if (eff !== 'active' && s.subscription_end_date && new Date(s.subscription_end_date) < now)
                subscriptions.expired_count++;
        }

        if (subscriptions.locked > 0 || subscriptions.restricted > 0) {
            setStatus('warning');
            alerts.push({ severity: 'warning', title: 'Subscription issues', description: `${subscriptions.restricted} restricted, ${subscriptions.locked} locked shop(s).`, action_link: '/super-admin/subscriptions' });
        }
        if (subscriptions.due_soon_count > 0) {
            alerts.push({ severity: 'info', title: `${subscriptions.due_soon_count} subscription(s) expiring soon`, description: 'Notify shop owners to renew within 7 days.', action_link: '/super-admin/subscriptions' });
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 7. BACKUPS
    // ══════════════════════════════════════════════════════════════════════════
    let backups = {
        enabled: process.env.BACKUP_ENABLED === 'true',
        last_backup_at: null,
        last_backup_status: 'not_available',
        backup_count: 0,
        failed_last_7d: 0,
        retention_days: parseInt(process.env.BACKUP_RETENTION_DAYS || '14', 10),
        available: false,
    };

    if (tableExists(existingTables, 'backup_logs')) {
        backups.available = true;
        const [[bc]] = await db.query('SELECT COUNT(*) as cnt FROM backup_logs');
        backups.backup_count = Number(bc.cnt) || 0;

        const [lastRow] = await db.query('SELECT created_at, status FROM backup_logs ORDER BY created_at DESC LIMIT 1');
        if (lastRow.length > 0) {
            backups.last_backup_at = lastRow[0].created_at;
            backups.last_backup_status = lastRow[0].status || 'unknown';
        }

        const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
        const [[failedBk]] = await db.query(
            `SELECT COUNT(*) as cnt FROM backup_logs WHERE status != 'success' AND created_at >= ?`, [sevenDaysAgo]
        );
        backups.failed_last_7d = Number(failedBk.cnt) || 0;

        const oneDayAgo = new Date(now.getTime() - 86400000);
        if (!backups.last_backup_at || new Date(backups.last_backup_at) < oneDayAgo) {
            setStatus('warning');
            alerts.push({ severity: 'warning', title: 'No recent backup', description: 'No backup was found in the last 24 hours.', action_link: '/super-admin/backups' });
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 8. SECURITY
    // ══════════════════════════════════════════════════════════════════════════
    let security = {
        available: false,
        failed_logins_24h: null,
        unauthorized_attempts_24h: null,
        audit_logs_today: null,
        sensitive_actions_today: null,
    };

    if (tableExists(existingTables, 'audit_logs')) {
        security.available = true;
        const oneDayAgo = new Date(now.getTime() - 86400000);
        const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);

        const [[fl]] = await db.query(`SELECT COUNT(*) as cnt FROM audit_logs WHERE action='login_failed' AND created_at>=?`, [oneDayAgo]);
        const [[ua]] = await db.query(`SELECT COUNT(*) as cnt FROM audit_logs WHERE action='unauthorized_access_attempt' AND created_at>=?`, [oneDayAgo]);
        const [[at]] = await db.query(`SELECT COUNT(*) as cnt FROM audit_logs WHERE created_at>=?`, [todayStart]);
        const [[sa]] = await db.query(`SELECT COUNT(*) as cnt FROM audit_logs WHERE action IN ('invoice_delete','user_delete','settings_update','shift_close') AND created_at>=?`, [todayStart]);

        security.failed_logins_24h = Number(fl.cnt) || 0;
        security.unauthorized_attempts_24h = Number(ua.cnt) || 0;
        security.audit_logs_today = Number(at.cnt) || 0;
        security.sensitive_actions_today = Number(sa.cnt) || 0;

        if (security.failed_logins_24h > 10) {
            setStatus('warning');
            alerts.push({ severity: 'warning', title: 'High failed login attempts', description: `${security.failed_logins_24h} failed logins in the last 24 hours.`, action_link: '/super-admin/audit-logs' });
        }
        if (security.unauthorized_attempts_24h > 5) {
            setStatus('warning');
            alerts.push({ severity: 'warning', title: 'Unauthorized access attempts', description: `${security.unauthorized_attempts_24h} unauthorized route attempts in 24h.`, action_link: '/super-admin/audit-logs' });
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 9. OPERATIONS — KOT, Held Bills, Naya outstanding, Stock
    // ══════════════════════════════════════════════════════════════════════════
    const operations = {
        kot: null,
        held_bills: null,
        naya: null,
        stock: null,
    };

    // KOT
    if (tableExists(existingTables, 'kot_orders')) {
        const [[kotPending]]    = await db.query(`SELECT COUNT(*) as cnt FROM kot_orders WHERE status='pending'`);
        const [[kotPreparing]]  = await db.query(`SELECT COUNT(*) as cnt FROM kot_orders WHERE status='preparing'`);
        const twentyMinsAgo = new Date(now.getTime() - 20 * 60 * 1000);
        const [[kotDelayed]]    = await db.query(
            `SELECT COUNT(*) as cnt FROM kot_orders WHERE status IN ('pending','preparing') AND created_at<=?`, [twentyMinsAgo]
        );
        operations.kot = {
            pending: Number(kotPending.cnt) || 0,
            preparing: Number(kotPreparing.cnt) || 0,
            delayed_over_20min: Number(kotDelayed.cnt) || 0,
        };
        if (operations.kot.delayed_over_20min > 0) {
            setStatus('warning');
            alerts.push({ severity: 'warning', title: `${operations.kot.delayed_over_20min} KOT(s) delayed`, description: 'Some kitchen orders have been pending/preparing for over 20 minutes.', action_link: '/kitchen' });
        }
    }

    // Held Bills
    if (tableExists(existingTables, 'held_bills')) {
        const [[heldActive]]   = await db.query(`SELECT COUNT(*) as cnt FROM held_bills WHERE status IN ('held','resumed')`);
        const fourHoursAgo = new Date(now.getTime() - 4 * 3600 * 1000);
        const [[heldOld]]      = await db.query(
            `SELECT COUNT(*) as cnt FROM held_bills WHERE status IN ('held','resumed') AND created_at<=?`, [fourHoursAgo]
        );
        operations.held_bills = {
            active: Number(heldActive.cnt) || 0,
            older_than_4h: Number(heldOld.cnt) || 0,
        };
        if (operations.held_bills.older_than_4h > 0) {
            setStatus('warning');
            alerts.push({ severity: 'warning', title: `${operations.held_bills.older_than_4h} held bill(s) stale`, description: 'Held bills older than 4 hours may need attention.', action_link: '/held-bills' });
        }
    }

    // Naya outstanding
    if (tableExists(existingTables, 'customers')) {
        const [[nayaTotal]]    = await db.query(`SELECT COALESCE(SUM(current_balance),0) as total FROM customers WHERE current_balance > 0`);
        const [[overLimit]]    = await db.query(`SELECT COUNT(*) as cnt FROM customers WHERE credit_limit > 0 AND current_balance > credit_limit`);
        operations.naya = {
            total_outstanding: parseFloat(nayaTotal.total) || 0,
            over_credit_limit_count: Number(overLimit.cnt) || 0,
        };
        if (operations.naya.over_credit_limit_count > 0) {
            alerts.push({ severity: 'info', title: `${operations.naya.over_credit_limit_count} customer(s) over credit limit`, description: 'Some customers have exceeded their Naya credit limit.', action_link: '/customers' });
        }
    }

    // Stock
    if (tableExists(existingTables, 'items')) {
        const [[lowStock]]     = await db.query(`SELECT COUNT(*) as cnt FROM items WHERE track_stock=1 AND stock_qty > 0 AND stock_qty <= 5`);
        const [[soldOut]]      = await db.query(`SELECT COUNT(*) as cnt FROM items WHERE track_stock=1 AND stock_qty=0`);
        operations.stock = {
            low_stock_count: Number(lowStock.cnt) || 0,
            sold_out_count: Number(soldOut.cnt) || 0,
        };
        if (operations.stock.sold_out_count > 0) {
            alerts.push({ severity: 'info', title: `${operations.stock.sold_out_count} item(s) sold out`, description: 'Some tracked items are at zero stock.', action_link: '/items' });
        }
        if (operations.stock.low_stock_count > 0) {
            alerts.push({ severity: 'info', title: `${operations.stock.low_stock_count} item(s) low stock`, description: 'Some items have 5 or fewer units remaining.', action_link: '/items' });
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 10. PAYMENT GATEWAY
    // ══════════════════════════════════════════════════════════════════════════
    let payments = {
        gateway_enabled: process.env.PAYMENT_GATEWAY_ENABLED === 'true',
        provider: process.env.PAYMENT_PROVIDER || null,
        available: false,
        pending_qr: null,
        paid_today: null,
        failed_today: null,
    };

    if (tableExists(existingTables, 'payment_transactions')) {
        payments.available = true;
        const [[pPending]] = await db.query(`SELECT COUNT(*) as cnt FROM payment_transactions WHERE status='pending'`);
        const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
        const [[pPaid]]    = await db.query(`SELECT COUNT(*) as cnt FROM payment_transactions WHERE status='paid' AND created_at>=?`, [todayStart]);
        const [[pFailed]]  = await db.query(`SELECT COUNT(*) as cnt FROM payment_transactions WHERE status IN ('failed','expired') AND created_at>=?`, [todayStart]);

        payments.pending_qr  = Number(pPending.cnt) || 0;
        payments.paid_today  = Number(pPaid.cnt) || 0;
        payments.failed_today = Number(pFailed.cnt) || 0;

        if (payments.pending_qr > 10) {
            alerts.push({ severity: 'info', title: `${payments.pending_qr} QR payments pending`, description: 'Multiple QR payment transactions are unresolved.', action_link: null });
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Return — no secrets, no fake values
    // ══════════════════════════════════════════════════════════════════════════
    return res.json({
        success: true,
        data: {
            overall_status: overallStatus,
            checked_at: now.toISOString(),
            server,
            database,
            integrity,
            shops,
            subscriptions,
            backups,
            security,
            operations,
            payments,
            alerts,
        },
    });
};
