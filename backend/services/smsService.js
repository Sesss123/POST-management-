const { db } = require('../config/db');

/**
 * smsService
 * Handles sending transactional and campaign SMS.
 */
class SMSService {
    /**
     * sendSMS
     * @param {Object} options { shopId, phone, message, type, campaignId }
     */
    async sendSMS({ shopId, phone, message, type = 'transactional', campaignId = null }) {
        // 1. Get SMS settings for the shop
        const [settings] = await db.query(
            'SELECT setting_key, setting_value FROM settings WHERE shop_id = ? AND group_name = "marketing"',
            [shopId]
        );
        
        const config = settings.reduce((acc, s) => {
            acc[s.setting_key] = s.setting_value === 'true' ? true : s.setting_value === 'false' ? false : s.setting_value;
            return acc;
        }, {});

        if (!config.sms_enabled) {
            console.log(`[SMS Disabled for Shop ${shopId}] Message to ${phone} not sent.`);
            return { success: false, message: 'SMS service disabled for this shop' };
        }

        // 2. Prepare log entry
        const [logResult] = await db.query(
            'INSERT INTO sms_logs (shop_id, campaign_id, recipient_phone, message, type, status) VALUES (?, ?, ?, ?, ?, ?)',
            [shopId, campaignId, phone, message, type, 'pending']
        );
        const logId = logResult.insertId;

        // 3. Send via provider
        let result = { success: false, providerRef: null, error: null };

        try {
            switch (config.sms_provider) {
                case 'mock':
                    result = await this._sendMock(phone, message);
                    break;
                case 'twilio':
                    // result = await this._sendTwilio(phone, message, config);
                    result = { success: false, error: 'Twilio provider not yet configured' };
                    break;
                default:
                    result = { success: false, error: 'Invalid SMS provider' };
            }

            // 4. Update log
            await db.query(
                'UPDATE sms_logs SET status = ?, provider_ref = ?, error_message = ? WHERE id = ?',
                [result.success ? 'sent' : 'failed', result.providerRef, result.error, logId]
            );

            return result;
        } catch (error) {
            console.error('[SMS Service Error]', error);
            await db.query(
                'UPDATE sms_logs SET status = ?, error_message = ? WHERE id = ?',
                ['failed', error.message, logId]
            );
            return { success: false, error: error.message };
        }
    }

    async _sendMock(phone, message) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`[MOCK SMS SENT] To: ${phone} | Content: ${message}`);
        return { success: true, providerRef: `MOCK-${Date.now()}` };
    }

    /**
     * sendNayaReminder
     * Sends a transactional SMS reminder for outstanding debt
     */
    async sendNayaReminder(shopId, customer) {
        const message = `Dear ${customer.name}, your outstanding balance at ${customer.shop_name} is Rs. ${customer.balance}. Please settle at your earliest convenience. Thank you!`;
        return this.sendSMS({
            shopId,
            phone: customer.phone,
            message,
            type: 'reminder'
        });
    }
}

module.exports = new SMSService();
