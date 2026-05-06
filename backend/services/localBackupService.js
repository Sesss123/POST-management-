const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { db } = require('../config/db');
const { generateUuid } = require('../utils/identifier');

class LocalBackupService {
    /**
     * Get platform settings for backup
     */
    async getSettings() {
        const [settings] = await db.query('SELECT * FROM platform_settings WHERE setting_key LIKE "backup_%" OR setting_key = "mysqldump_path"');
        const config = {};
        settings.forEach(s => config[s.setting_key] = s.setting_value);
        return config;
    }

    /**
     * Create a MySQL database backup locally
     * @returns {Promise<object>} - Backup file details
     */
    async createDatabaseBackup(userId = null, type = 'automated') {
        const config = await this.getSettings();
        
        const isEnabled = config.backup_enabled === 'true';
        const backupLocalDir = config.backup_local_dir || 'database/backups';
        const retentionDays = parseInt(config.backup_retention_days || '14');
        const mysqldumpPath = config.mysqldump_path || process.env.MYSQLDUMP_PATH || 'mysqldump';
        
        const backupDir = path.resolve(__dirname, '../../', backupLocalDir);
        
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        return new Promise((resolve, reject) => {
            if (!isEnabled && type !== 'manual') {
                return reject(new Error('Backup service is disabled in platform settings'));
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const fileName = `restoledgerdb_${type}_${timestamp}.sql`;
            const filePath = path.join(backupDir, fileName);

            const host = process.env.DB_HOST || 'localhost';
            const user = process.env.DB_USER || 'root';
            const password = process.env.DB_PASSWORD || '';
            const database = process.env.DB_NAME || 'restoledgerdb';

            const passArg = password ? `-p"${password}"` : '';
            
            // Construct command with properly quoted paths for Windows support
            const cmd = `"${mysqldumpPath}" -h ${host} -u ${user} ${passArg} ${database} > "${filePath}"`;

            console.log(`Starting ${type} database backup: ${fileName}...`);
            
            const startTime = Date.now();
            const logUuid = generateUuid();

            exec(cmd, async (error, stdout, stderr) => {
                let status = 'success';
                let errorMessage = null;
                let sizeMb = 0;

                if (error) {
                    status = 'failed';
                    errorMessage = stderr || error.message;
                    console.error('Backup Error:', errorMessage);
                } else if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
                    status = 'failed';
                    errorMessage = 'Backup file is empty or was not created.';
                    console.error('Backup Error:', errorMessage);
                } else {
                    const stats = fs.statSync(filePath);
                    sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
                    console.log(`Backup completed successfully: ${fileName} (${sizeMb} MB)`);
                }

                // Log to database
                try {
                    await db.query(
                        `INSERT INTO backup_logs (uuid, backup_type, file_name, local_path, status, error_message, file_size_mb, created_by)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [logUuid, type, fileName, filePath, status, errorMessage, sizeMb, userId]
                    );
                } catch (logErr) {
                    console.warn('Failed to save backup log to DB:', logErr.message);
                }

                // Cleanup old backups
                await this.cleanupOldBackups(backupDir, retentionDays);

                if (status === 'success') {
                    resolve({ uuid: logUuid, fileName, filePath, sizeMb });
                } else {
                    reject(new Error(errorMessage));
                }
            });
        });
    }

    /**
     * Delete backups older than retention days
     */
    async cleanupOldBackups(backupDir, retentionDays) {
        try {
            if (!fs.existsSync(backupDir)) return;
            
            const files = fs.readdirSync(backupDir);
            const now = Date.now();

            files.forEach(file => {
                if (file.endsWith('.sql') || file.endsWith('.gz')) {
                    const filePath = path.join(backupDir, file);
                    const stats = fs.statSync(filePath);
                    const ageDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

                    if (ageDays > retentionDays) {
                        fs.unlinkSync(filePath);
                        console.log(`Deleted old local backup: ${file} (${ageDays.toFixed(1)} days old)`);
                    }
                }
            });
        } catch (error) {
            console.warn('Backup Cleanup Warning:', error.message);
        }
    }
}

module.exports = new LocalBackupService();

