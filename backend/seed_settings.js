const { db } = require('./config/db');
async function seed() {
    try {
        await db.query(`
            INSERT INTO platform_settings (setting_key, setting_value) VALUES 
            ('backup_enabled', 'true'),
            ('backup_schedule_time', '23:30'),
            ('backup_retention_days', '14'),
            ('backup_local_dir', 'database/backups'),
            ('mysqldump_path', 'C:\\\\xampp\\\\mysql\\\\bin\\\\mysqldump.exe')
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        `);
        console.log('Settings seeded');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
seed();
