const { db } = require('../config/db');
const { generateUuid } = require('../utils/identifier');

class LoyaltyService {
    /**
     * Get loyalty settings for a shop
     */
    async getLoyaltySettings(shopId) {
        const [rows] = await db.query('SELECT * FROM settings WHERE shop_id = ? AND setting_key LIKE "loyalty_%"', [shopId]);
        return rows.reduce((acc, s) => {
            acc[s.setting_key] = s.setting_value;
            return acc;
        }, {});
    }

    /**
     * Calculate points based on amount
     */
    calculatePoints(amount, settings) {
        const earnRateAmount = parseFloat(settings.loyalty_earn_rate_amount || 100);
        const earnPoints = parseFloat(settings.loyalty_earn_points || 1);
        
        if (earnRateAmount <= 0) return 0;
        
        return Math.floor(amount / earnRateAmount) * earnPoints;
    }

    /**
     * Add points to a customer
     */
    async addPoints(connection, { customerId, invoiceId, amount, type = 'earn', description, userId, shopId }) {
        const settings = await this.getLoyaltySettings(shopId);
        
        if (settings.loyalty_enabled !== 'true') return null;

        // For earning, calculate points from amount
        // For adjustment, points might be passed directly
        let pointsToSave = 0;
        if (type === 'earn') {
            pointsToSave = this.calculatePoints(amount, settings);
        } else {
            // If it's an adjustment, assume amount IS the points
            pointsToSave = amount;
        }

        if (pointsToSave === 0) return null;

        // Update customer balance
        await connection.query(
            'UPDATE customers SET loyalty_points = loyalty_points + ? WHERE id = ? AND shop_id = ?',
            [pointsToSave, customerId, shopId]
        );

        // Get new balance
        const [[customer]] = await connection.query(
            'SELECT loyalty_points FROM customers WHERE id = ? AND shop_id = ?',
            [customerId, shopId]
        );

        // Record transaction
        const uuid = generateUuid();
        await connection.query(
            `INSERT INTO loyalty_transactions (uuid, shop_id, customer_id, invoice_id, type, points, balance_after, description, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [uuid, shopId, customerId, invoiceId || null, type, pointsToSave, customer.loyalty_points, description, userId]
        );

        return { pointsEarned: pointsToSave, newBalance: customer.loyalty_points };
    }

    /**
     * Redeem points
     */
    async redeemPoints(connection, { customerId, points, invoiceId, userId, shopId }) {
        const settings = await this.getLoyaltySettings(shopId);
        
        if (settings.loyalty_enabled !== 'true') {
            throw new Error('Loyalty system is disabled');
        }

        const minRedeem = parseFloat(settings.loyalty_min_redeem_points || 50);
        if (points < minRedeem) {
            throw new Error(`Minimum redemption is ${minRedeem} points`);
        }

        // Validate points availability
        const [[customer]] = await connection.query(
            'SELECT loyalty_points FROM customers WHERE id = ? AND shop_id = ?',
            [customerId, shopId]
        );

        if (customer.loyalty_points < points) {
            throw new Error('Insufficient loyalty points');
        }

        // Deduct points
        await connection.query(
            'UPDATE customers SET loyalty_points = loyalty_points - ? WHERE id = ? AND shop_id = ?',
            [points, customerId, shopId]
        );

        const newBalance = customer.loyalty_points - points;

        // Record transaction
        const uuid = generateUuid();
        await connection.query(
            `INSERT INTO loyalty_transactions (uuid, shop_id, customer_id, invoice_id, type, points, balance_after, description, created_by)
             VALUES (?, ?, ?, ?, 'redeem', ?, ?, ?, ?)`,
            [uuid, shopId, customerId, invoiceId || null, -points, newBalance, `Redeemed for invoice discount`, userId]
        );

        // Calculate discount value
        const redeemRatePoints = parseFloat(settings.loyalty_redeem_rate_points || 1);
        const redeemValue = parseFloat(settings.loyalty_redeem_value || 1);
        const discountValue = (points / redeemRatePoints) * redeemValue;

        return { discountValue, newBalance };
    }
}

module.exports = new LoyaltyService();
