const { db } = require('../config/db');

class PlatformSettingsService {
    constructor() {
        this.settings = {
            // Billing & Subscriptions
            default_monthly_amount: '5000',
            grace_days: '7',
            lock_days: '14',
            trial_days: '14',
            support_contact: 'support@restoledger.com',
            
            // Data & Backups
            backup_retention: '30',
            
            // Security
            system_security_level: 'high',
            max_login_attempts: '5',
            session_expiry: '24', // Hours
            force_2fa_admins: 'false',
            
            // Comms
            email_provider: 'smtp',
            sender_name: 'RestoLedger Notifications',
            sender_email: 'no-reply@restoledger.com',
            sms_gateway: 'twilio',
            
            // General
            platform_name: 'RestoLedger POS',
            maintenance_mode: 'false',
            primary_language: 'en',

            // API & Integrations
            genie_merchant_id: '',
            genie_api_key: '',
            genie_api_secret: '',
            sms_api_key: '',
            email_api_key: ''
        };
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        await this.refresh();
        this.initialized = true;
        console.log('>>> Platform Settings Service Initialized');
    }

    async refresh() {
        try {
            const [rows] = await db.query('SELECT setting_key, setting_value FROM platform_settings');
            rows.forEach(row => {
                this.settings[row.setting_key] = row.setting_value;
            });
        } catch (err) {
            console.error('Failed to refresh platform settings:', err);
        }
    }

    get(key, defaultValue = null) {
        return this.settings[key] || defaultValue || this.settings[key];
    }

    getInt(key, defaultValue = 0) {
        const val = this.get(key);
        return parseInt(val, 10) || defaultValue;
    }

    getBool(key) {
        const val = this.get(key);
        return val === 'true' || val === true || val === '1' || val === 1;
    }

    getAll() {
        return { ...this.settings };
    }
}

module.exports = new PlatformSettingsService();
