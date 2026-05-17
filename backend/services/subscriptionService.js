/**
 * Subscription Service
 * Handles core subscription business logic and status resolution.
 */
const { db } = require('../config/db');
const { generateUuid } = require('../utils/identifier');
const platformSettingsService = require('./platformSettingsService');

/**
 * Resolves the effective subscription status based on stored dates and status overrides.
 * @param {Object} shop The shop record from the database
 * @returns {String} The resolved status: trial, active, grace, restricted, locked, suspended, cancelled
 */
const resolveEffectiveSubscriptionStatus = (shop) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Suspension / Cancellation (Manual Overrides)
    if (shop.status === 'suspended' || shop.subscription_status === 'suspended') return 'suspended';
    if (shop.subscription_status === 'cancelled') return 'cancelled';
    if (shop.subscription_status === 'locked') return 'locked';

    const endDate = shop.subscription_end_date ? new Date(shop.subscription_end_date) : null;
    const graceDate = shop.grace_until ? new Date(shop.grace_until) : null;
    const trialDate = shop.trial_ends_at ? new Date(shop.trial_ends_at) : null;

    // 2. Trial Status
    if (shop.subscription_status === 'trial') {
        if (trialDate && today <= trialDate) return 'trial';
        // If trial expired and no paid subscription yet, move to restricted or locked
        if (!endDate) return 'restricted';
    }

    // 3. Paid Subscription Status
    if (endDate) {
        if (today <= endDate) return 'active';
        
        // 4. Grace Period
        if (graceDate && today <= graceDate) return 'grace';

        // 5. Restricted Access (Past Grace)
        return 'restricted';
    }

    // Default fallback
    return 'trial';
};

/**
 * Log a subscription related action
 */
const logSubscriptionAction = async (connection, {
    shopId, action, oldStatus, newStatus, amount, paymentMethod, referenceNo, notes, performedBy, oldValue, newValue
}) => {
    const uuid = generateUuid();
    await connection.query(
        `INSERT INTO subscription_logs 
         (uuid, shop_id, action, old_status, new_status, amount, payment_method, reference_no, note, recorded_by, old_value, new_value)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            uuid, shopId, action, oldStatus, newStatus, amount || null, paymentMethod || null, 
            referenceNo || null, notes || null, performedBy || null,
            oldValue ? JSON.stringify(oldValue) : null,
            newValue ? JSON.stringify(newValue) : null
        ]
    );
};

/**
 * Record a payment and extend subscription
 */
const markPaymentReceived = async (shopId, payload, userId) => {
    const { amount, payment_method, reference_no, months = 1, note } = payload;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [shops] = await connection.query(
            'SELECT id, name, subscription_status, subscription_end_date, grace_until FROM shops WHERE id = ?',
            [shopId]
        );
        if (shops.length === 0) throw new Error('Shop not found');
        const shop = shops[0];

        // Calculate new end date
        const baseDate = shop.subscription_end_date && new Date(shop.subscription_end_date) > new Date()
            ? new Date(shop.subscription_end_date)
            : new Date();
        
        const newEndDate = new Date(baseDate);
        newEndDate.setMonth(newEndDate.getMonth() + parseInt(months));

        const graceDays = platformSettingsService.getInt('grace_days', 7);
        const newGraceUntil = new Date(newEndDate);
        newGraceUntil.setDate(newGraceUntil.getDate() + graceDays);

        // 1. Update Shop
        await connection.query(
            `UPDATE shops SET
                subscription_status   = 'active',
                subscription_end_date = ?,
                grace_until           = ?,
                last_payment_date     = CURRENT_TIMESTAMP,
                locked_at             = NULL
             WHERE id = ?`,
            [newEndDate, newGraceUntil, shopId]
        );

        // 2. Create Payment Record
        const payUuid = generateUuid();
        await connection.query(
            `INSERT INTO subscription_payments 
             (uuid, shop_id, amount, payment_method, reference_no, period_start, period_end, recorded_by, note)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [payUuid, shopId, amount, payment_method, reference_no, baseDate, newEndDate, userId, note]
        );

        // 3. Log Action
        await logSubscriptionAction(connection, {
            shopId,
            action: 'payment_received',
            oldStatus: shop.subscription_status,
            newStatus: 'active',
            amount,
            paymentMethod: payment_method,
            referenceNo: reference_no,
            notes: note || `Payment of ${amount} for ${months} month(s).`,
            performedBy: userId,
            newValue: { subscription_end_date: newEndDate }
        });

        await connection.commit();
        return { success: true, newEndDate };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Extend subscription without payment
 */
const extendSubscription = async (shopId, payload, userId) => {
    const { days, months, note } = payload;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [shops] = await connection.query(
            'SELECT id, subscription_status, subscription_end_date, grace_until FROM shops WHERE id = ?',
            [shopId]
        );
        if (shops.length === 0) throw new Error('Shop not found');
        const shop = shops[0];

        const baseDate = shop.subscription_end_date && new Date(shop.subscription_end_date) > new Date()
            ? new Date(shop.subscription_end_date)
            : new Date();
        
        const newEndDate = new Date(baseDate);
        if (days) newEndDate.setDate(newEndDate.getDate() + parseInt(days));
        if (months) newEndDate.setMonth(newEndDate.getMonth() + parseInt(months));

        const newGraceUntil = new Date(newEndDate);
        const graceDays = platformSettingsService.getInt('grace_days', 7);
        newGraceUntil.setDate(newGraceUntil.getDate() + graceDays);

        await connection.query(
            'UPDATE shops SET subscription_end_date = ?, grace_until = ?, subscription_status = "active" WHERE id = ?',
            [newEndDate, newGraceUntil, shopId]
        );

        await logSubscriptionAction(connection, {
            shopId,
            action: 'subscription_extended',
            oldStatus: shop.subscription_status,
            newStatus: 'active',
            notes: note || `Manual extension by ${days || 0} days / ${months || 0} months.`,
            performedBy: userId,
            newValue: { subscription_end_date: newEndDate }
        });

        await connection.commit();
        return { success: true, newEndDate };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Give manual grace days
 */
const giveGraceDays = async (shopId, payload, userId) => {
    const { days, note } = payload;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [shops] = await connection.query('SELECT grace_until FROM shops WHERE id = ?', [shopId]);
        if (shops.length === 0) throw new Error('Shop not found');
        
        const baseDate = shops[0].grace_until ? new Date(shops[0].grace_until) : new Date();
        const newGraceUntil = new Date(baseDate);
        newGraceUntil.setDate(newGraceUntil.getDate() + parseInt(days));

        await connection.query('UPDATE shops SET grace_until = ? WHERE id = ?', [newGraceUntil, shopId]);
        await logSubscriptionAction(connection, {
            shopId,
            action: 'grace_extended',
            notes: note || `Manual grace extended by ${days} days.`,
            performedBy: userId,
            newValue: { grace_until: newGraceUntil }
        });
        await connection.commit();
        return { success: true, newGraceUntil };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Lock/Unlock shop
 */
const setLockStatus = async (shopId, isLocked, note, userId) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const status = isLocked ? 'locked' : 'active';
        await connection.query(
            'UPDATE shops SET subscription_status = ?, locked_at = ? WHERE id = ?',
            [status, isLocked ? new Date() : null, shopId]
        );
        await logSubscriptionAction(connection, {
            shopId,
            action: isLocked ? 'shop_locked' : 'shop_unlocked',
            newStatus: status,
            notes: note || `Manual ${isLocked ? 'lock' : 'unlock'} by Super Admin.`,
            performedBy: userId
        });
        await connection.commit();
        return { success: true };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Suspend Shop
 */
const suspendShop = async (shopId, reason, userId) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(
            'UPDATE shops SET status = "suspended", subscription_status = "suspended", suspension_reason = ? WHERE id = ?',
            [reason, shopId]
        );
        await logSubscriptionAction(connection, {
            shopId,
            action: 'shop_suspended',
            newStatus: 'suspended',
            notes: reason,
            performedBy: userId
        });
        await connection.commit();
        return { success: true };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    resolveEffectiveSubscriptionStatus,
    markPaymentReceived,
    extendSubscription,
    giveGraceDays,
    setLockStatus,
    suspendShop,
    logSubscriptionAction
};
