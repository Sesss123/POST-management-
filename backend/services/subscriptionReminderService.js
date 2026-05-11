const cron = require('node-cron');
const { db } = require('../config/db');
const notificationService = require('./notificationService');
const logger = require('../utils/winstonLogger');

/**
 * Subscription Reminder Service
 * Scans the database daily for shops with near-expiry subscriptions.
 */
class SubscriptionReminderService {
    start() {
        // Runs every day at 09:00 AM
        cron.schedule('0 9 * * *', () => {
            this.processReminders();
        });
        
        logger.info('Subscription Reminder Service: Scheduled for 09:00 daily');
    }

    async processReminders() {
        try {
            logger.info('Running Daily Subscription Expiry Check...');

            // Find shops expiring in exactly 3 days or 1 day
            const query = `
                SELECT 
                    s.id, s.name as shop_name, s.subscription_expiry, 
                    u.email as admin_email, u.name as admin_name,
                    DATEDIFF(s.subscription_expiry, NOW()) as days_left
                FROM shops s
                JOIN users u ON s.id = u.shop_id
                WHERE u.role = 'admin' 
                AND s.status = 'active'
                AND DATEDIFF(s.subscription_expiry, NOW()) IN (3, 1)
            `;

            const [shops] = await db.query(query);

            if (shops.length === 0) {
                logger.info('No expiring subscriptions found today.');
                return;
            }

            for (const shop of shops) {
                logger.info(`Sending ${shop.days_left}-day expiry reminder to ${shop.shop_name} (${shop.admin_email})`);
                
                await notificationService.sendExpiryWarning(
                    shop.admin_email, 
                    shop.shop_name, 
                    shop.days_left
                );

                // Optional: Send SMS if phone number exists
                // if (shop.phone) {
                //     await notificationService.sendSMS(shop.phone, `Reminder: Your RestoLedger subscription for ${shop.shop_name} expires in ${shop.days_left} days. Please renew to avoid service lock.`);
                // }
            }

            logger.info(`Completed reminders for ${shops.length} shops.`);
        } catch (err) {
            logger.error('Error in Subscription Reminder Service:', err);
        }
    }
}

module.exports = new SubscriptionReminderService();
