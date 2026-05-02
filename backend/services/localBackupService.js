const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { db } = require('../config/db');

class LocalBackupService {
    constructor() {
        this.backupDir = path.resolve(__dirname, process.env.BACKUP_LOCAL_DIR || '../../database/backups');
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    /**
     * Create a MySQL database backup locally
     * @returns {Promise<object>} - Backup file details
     */
    async createDatabaseBackup(userId = null, type = 'database') {
        return new Promise((resolve, reject) => {
            if (process.env.BACKUP_ENABLED !== 'true' && type !== 'manual') {
                return reject(new Error('Backup service is disabled in .env'));
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const fileName = `restoledgerdb_backup_${timestamp}.sql`;
            const filePath = path.join(this.backupDir, fileName);

            const host = process.env.DB_HOST || 'localhost';
            const user = process.env.DB_USER || 'root';
            const password = process.env.DB_PASSWORD || '';
            const database = process.env.DB_NAME || 'restoledgerdb';

            const mysqldump = process.env.MYSQLDUMP_PATH || 'mysqldump';
            const passArg = password ? `-p${password}` : '';
            
            // Note: Wrapping path in quotes to handle spaces in directory names
            const cmd = `"${mysqldump}" -h ${host} -u ${user} ${passArg} ${database} > "${filePath}"`;

            console.log(`Starting local database backup: ${fileName}...`);
            
            exec(cmd, async (error, stdout, stderr) => {
                let status = 'success';
                let errorMessage = null;
                let sizeMb = 0;

                if (error) {
                    status = 'failed';
                    errorMessage = error.message;
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

                // Log to database if logs table exists
                try {
                    await this.logBackup({
                        type,
                        fileName,
                        filePath,
                        status,
                        error: errorMessage,
                        sizeMb,
                        userId
                    });
                } catch (logErr) {
                    console.warn('Failed to save backup log to DB:', logErr.message);
                }

                // Cleanup old backups
                await this.cleanupOldBackups();

                if (status === 'success') {
                    resolve({ fileName, filePath, sizeMb });
                } else {
                    reject(new Error(errorMessage));
                }
            });
        });
    }

    /**
     * Log backup status to DB
     */
    async logBackup(data) {
        // Check if backup_logs table exists first (optional but safer)
        await db.query(
            `INSERT INTO backup_logs (backup_type, file_name, local_path, status, error_message, file_size_mb, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                data.type,
                data.fileName,
                data.filePath,
                data.status,
                data.error,
                data.sizeMb,
                data.userId
            ]
        );
    }

    /**
     * Delete backups older than retention days
     */
    async cleanupOldBackups() {
        try {
            const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 14;
            const files = fs.readdirSync(this.backupDir);
            const now = Date.now();

            files.forEach(file => {
                if (file.endsWith('.sql') || file.endsWith('.gz')) {
                    const filePath = path.join(this.backupDir, file);
                    const stats = fs.statSync(filePath);
                    const ageDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

                    if (ageDays > retentionDays) {
                        fs.unlinkSync(filePath);
                        console.log(`Deleted old local backup: ${file}`);
                    }
                }
            });
        } catch (error) {
            console.warn('Backup Cleanup Warning:', error.message);
        }
    }
}

module.exports = new LocalBackupService();
