const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');
const { db } = require('../config/db');
const { generateUuid } = require('../utils/identifier');
const { pipeline } = require('stream/promises');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

class LocalBackupService {
    /**
     * Get platform settings for backup
     */
    async getSettings() {
        const [settings] = await db.query('SELECT * FROM platform_settings WHERE setting_key LIKE "backup_%" OR setting_key = "mysqldump_path"');
        const config = {};
        settings.forEach(s => config[s.setting_key] = s.setting_value);
        
        // Fallback to env if not in platform_settings
        config.backup_encryption_enabled = config.backup_encryption_enabled || process.env.BACKUP_ENCRYPTION_ENABLED || 'false';
        config.backup_encryption_password = config.backup_encryption_password || process.env.BACKUP_ENCRYPTION_PASSWORD;
        
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
                let isEncrypted = 0;
                let encryptionMethod = null;

                if (error) {
                    status = 'failed';
                    let rawError = stderr || error.message || 'Unknown error';
                    errorMessage = rawError.replace(/-p"[^"]*"/g, '-p"***"').replace(/-p\S+/g, '-p***');
                    console.error('Backup Error:', errorMessage);
                } else if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
                    status = 'failed';
                    errorMessage = 'Backup file is empty or was not created.';
                    console.error('Backup Error:', errorMessage);
                } else {
                    try {
                        // 1. Post-process: Gzip and Encrypt
                        const gzPath = `${filePath}.gz`;
                        const encPath = `${gzPath}.enc`;
                        const encryptionEnabled = config.backup_encryption_enabled === 'true';
                        const encryptionPassword = config.backup_encryption_password;

                        if (encryptionEnabled && !encryptionPassword) {
                            console.warn('Backup Encryption enabled but no password set. Skipping encryption.');
                        }

                        // Pipe: Read SQL -> Gzip -> (optional) Encrypt -> Write
                        const source = fs.createReadStream(filePath);
                        const gzip = zlib.createGzip();
                        
                        if (encryptionEnabled && encryptionPassword) {
                            // AES-256-CBC for backup files (standard for large files)
                            const key = crypto.scryptSync(encryptionPassword, 'salt', 32);
                            const iv = crypto.randomBytes(16);
                            const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
                            
                            const dest = fs.createWriteStream(encPath);
                            dest.write(iv); // Prefix with IV
                            
                            await pipeline(source, gzip, cipher, dest);
                            
                            fs.unlinkSync(filePath); // Delete raw SQL
                            isEncrypted = 1;
                            encryptionMethod = 'aes-256-cbc';
                            console.log(`Backup encrypted successfully: ${fileName}.gz.enc`);
                        } else {
                            const dest = fs.createWriteStream(gzPath);
                            await pipeline(source, gzip, dest);
                            fs.unlinkSync(filePath); // Delete raw SQL
                        }

                        const finalPath = isEncrypted ? encPath : gzPath;
                        const finalName = path.basename(finalPath);
                        const stats = fs.statSync(finalPath);
                        sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
                        
                        console.log(`Backup completed successfully: ${finalName} (${sizeMb} MB)`);

                        // AWS S3 Cloud Upload
                        let s3Url = null;
                        if (process.env.AWS_S3_BUCKET_NAME && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
                            try {
                                console.log(`Starting S3 upload for ${finalName}...`);
                                const s3Client = new S3Client({
                                    region: process.env.AWS_REGION || 'us-east-1',
                                    credentials: {
                                        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                                        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                                    }
                                });
                                
                                const fileStream = fs.createReadStream(finalPath);
                                const uploadParams = {
                                    Bucket: process.env.AWS_S3_BUCKET_NAME,
                                    Key: `backups/${finalName}`,
                                    Body: fileStream,
                                };
                                
                                await s3Client.send(new PutObjectCommand(uploadParams));
                                s3Url = `s3://${process.env.AWS_S3_BUCKET_NAME}/backups/${finalName}`;
                                console.log(`Successfully uploaded ${finalName} to S3.`);
                            } catch (s3Err) {
                                console.error('S3 Upload Failed:', s3Err.message);
                                // We don't fail the local backup if S3 fails, just log it.
                            }
                        }

                        // Log to database
                        await db.query(
                            `INSERT INTO backup_logs (uuid, backup_type, file_name, local_path, status, error_message, file_size_mb, is_encrypted, encryption_method, created_by)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [logUuid, type, finalName, finalPath, 'success', s3Url ? `Uploaded to S3: ${s3Url}` : null, sizeMb, isEncrypted, encryptionMethod, userId]
                        );

                        return resolve({ uuid: logUuid, fileName: finalName, filePath: finalPath, sizeMb, isEncrypted });

                    } catch (procErr) {
                        status = 'failed';
                        errorMessage = `Post-processing failed: ${procErr.message}`;
                        console.error('Backup Processing Error:', procErr);
                    }
                }

                // Log failure to database
                try {
                    await db.query(
                        `INSERT INTO backup_logs (uuid, backup_type, file_name, local_path, status, error_message, file_size_mb, created_by)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [logUuid, type, fileName, filePath, status, errorMessage, sizeMb, userId]
                    );
                } catch (logErr) {
                    console.warn('Failed to save backup log to DB:', logErr.message);
                }

                reject(new Error(errorMessage));
            });
        });
    }

    /**
     * Get total storage used by backups
     */
    async getTotalStorageUsed() {
        try {
            const config = await this.getSettings();
            const backupLocalDir = config.backup_local_dir || 'database/backups';
            const backupDir = path.resolve(__dirname, '../../', backupLocalDir);
            
            if (!fs.existsSync(backupDir)) return 0;
            
            const files = fs.readdirSync(backupDir);
            let totalBytes = 0;

            files.forEach(file => {
                if (file.endsWith('.sql') || file.endsWith('.gz') || file.endsWith('.enc')) {
                    const filePath = path.join(backupDir, file);
                    const stats = fs.statSync(filePath);
                    totalBytes += stats.size;
                }
            });

            return (totalBytes / (1024 * 1024)).toFixed(2);
        } catch (error) {
            console.warn('Failed to calculate backup storage:', error.message);
            return 0;
        }
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
                if (file.endsWith('.sql') || file.endsWith('.gz') || file.endsWith('.enc')) {
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

