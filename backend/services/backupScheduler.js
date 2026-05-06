const cron = require('node-cron');
const localBackupService = require('./localBackupService');
const { db } = require('../config/db');

class BackupScheduler {
    constructor() {
        this.currentJob = null;
        this.isProcessing = false;
    }

    /**
     * Start the scheduler
     */
    async start() {
        console.log('Starting Backup Scheduler...');
        await this.scheduleJob();

        
        // Refresh schedule every hour to pick up changes from platform_settings
        setInterval(() => this.scheduleJob(), 3600000);
    }

    /**
     * Schedule or re-schedule the backup job based on platform_settings
     */
    async scheduleJob() {
        try {
            const config = await localBackupService.getSettings();
            const isEnabled = config.backup_enabled === 'true';
            const scheduleTime = config.backup_schedule_time || '23:30'; // Format: HH:mm

            if (!isEnabled) {
                if (this.currentJob) {
                    this.currentJob.stop();
                    this.currentJob = null;
                    console.log('Backup Scheduler: Job stopped (disabled in settings)');
                }
                return;
            }

            // Convert HH:mm to cron format: mm HH * * *
            const [hour, minute] = scheduleTime.split(':');
            const cronTime = `${minute} ${hour} * * *`;

            if (this.currentJob) {
                // If the time hasn't changed, don't re-schedule
                // (Simplified: we just re-schedule to be safe, node-cron handles it)
                this.currentJob.stop();
            }

            this.currentJob = cron.schedule(cronTime, () => {
                this.runBackup();
            });

            console.log(`Backup Scheduler: Job scheduled for ${scheduleTime} daily (${cronTime})`);
        } catch (error) {
            console.error('Backup Scheduler Error:', error.message);
        }
    }

    /**
     * Execute the backup
     */
    async runBackup() {
        if (this.isProcessing) {
            console.warn('Backup Scheduler: Skipping run, a backup is already in progress.');
            return;
        }

        this.isProcessing = true;
        console.log('Backup Scheduler: Starting scheduled backup...');
        
        try {
            // userId 1 is typically the first Super Admin or system user
            await localBackupService.createDatabaseBackup(1, 'automated');
            console.log('Backup Scheduler: Scheduled backup completed successfully.');
        } catch (error) {
            console.error('Backup Scheduler Failure:', error.message);
        } finally {
            this.isProcessing = false;
        }
    }
}

module.exports = new BackupScheduler();
