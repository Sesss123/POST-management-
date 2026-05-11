const { db } = require('../config/db');

class SecuritySettingsService {
    constructor() {
        this.settings = {
            security_auth_limit: 10,
            security_auth_window: 15,
            security_general_limit: 1000,
            security_general_window: 15,
            security_public_limit: 300,
            security_public_window: 15,
            security_payment_limit: 120,
            security_payment_window: 5,
            security_super_admin_limit: 300,
            security_super_admin_window: 15
        };
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        await this.refresh();
        this.initialized = true;
        console.log('>>> Security Settings Service Initialized');
    }

    async refresh() {
        try {
            const [rows] = await db.query('SELECT setting_key, setting_value FROM platform_settings WHERE setting_key LIKE "security_%"');
            rows.forEach(row => {
                this.settings[row.setting_key] = parseInt(row.setting_value) || this.settings[row.setting_key];
            });
        } catch (err) {
            console.error('Failed to refresh security settings:', err);
        }
    }

    get(key) {
        return this.settings[key];
    }
}

module.exports = new SecuritySettingsService();
