const { db } = require('../config/db');

async function migrate() {
    console.log('--- Starting Phase 13: Marketing & SMS Integration Migration ---');
    
    try {
        // 1. Create sms_campaigns table
        await db.query(`
            CREATE TABLE IF NOT EXISTS sms_campaigns (
                id INT AUTO_INCREMENT PRIMARY KEY,
                uuid CHAR(36) UNIQUE NOT NULL,
                shop_id INT NOT NULL,
                name VARCHAR(150) NOT NULL,
                message TEXT NOT NULL,
                target_group ENUM('all', 'active_customers', 'debtors', 'loyalty_members') DEFAULT 'all',
                status ENUM('draft', 'scheduled', 'sending', 'completed', 'failed') DEFAULT 'draft',
                total_recipients INT DEFAULT 0,
                successful_sends INT DEFAULT 0,
                failed_sends INT DEFAULT 0,
                scheduled_at DATETIME NULL,
                created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_shop_status (shop_id, status)
            )
        `);

        // 2. Create sms_logs table
        await db.query(`
            CREATE TABLE IF NOT EXISTS sms_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                shop_id INT NOT NULL,
                campaign_id INT NULL,
                recipient_phone VARCHAR(20) NOT NULL,
                message TEXT NOT NULL,
                type ENUM('campaign', 'transactional', 'reminder') DEFAULT 'transactional',
                status ENUM('pending', 'sent', 'delivered', 'failed') DEFAULT 'pending',
                error_message TEXT NULL,
                provider_ref VARCHAR(100) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_shop_phone (shop_id, recipient_phone),
                FOREIGN KEY (campaign_id) REFERENCES sms_campaigns(id) ON DELETE SET NULL
            )
        `);

        // 3. Add SMS settings to shops or global settings?
        // Let's add them as settings in the settings table for each shop
        const smsSettings = [
            ['marketing', 'sms_enabled', 'boolean', 'false', 'Enable SMS marketing and notifications', 'Enable SMS Service'],
            ['marketing', 'sms_provider', 'string', 'mock', 'SMS service provider (mock/twilio/local)', 'SMS Provider'],
            ['marketing', 'sms_reminder_enabled', 'boolean', 'true', 'Auto-send SMS for Naya reminders', 'Naya SMS Reminders'],
            ['marketing', 'sms_promotion_enabled', 'boolean', 'false', 'Allow sending promotional campaigns', 'Promotional SMS']
        ];

        // Seed settings for all shops
        const [shops] = await db.query('SELECT id FROM shops');
        for (const shop of shops) {
            for (const [group, key, type, val, desc, label] of smsSettings) {
                await db.query(
                    'INSERT IGNORE INTO settings (shop_id, group_name, setting_key, setting_type, setting_value, description, label) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [shop.id, group, key, type, val, desc, label]
                );
            }
        }

        console.log('--- Migration Complete ---');
        process.exit(0);
    } catch (error) {
        console.error('Migration Failed:', error);
        process.exit(1);
    }
}

migrate();
