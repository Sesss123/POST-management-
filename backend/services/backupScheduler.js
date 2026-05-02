const cron = require('node-cron');
const localBackupService = require('./localBackupService');

class BackupScheduler {
    constructor() {
        this.task = null;
    }

    start() {
        if (process.env.BACKUP_ENABLED !== 'true') {
            console.log('Backup Service: DISABLED (via .env)');
            return;
        }

        const cronSchedule = process.env.BACKUP_CRON || '30 23 * * *'; // Default 11:30 PM
        
        if (!cron.validate(cronSchedule)) {
            console.error(`Backup Service: Invalid CRON expression "${cronSchedule}". Using default.`);
            return this.startWithSchedule('30 23 * * *');
        }

        this.startWithSchedule(cronSchedule);
    }

    startWithSchedule(schedule) {
        console.log(`Backup Service: ENABLED. Schedule: "${schedule}"`);
        
        this.task = cron.schedule(schedule, async () => {
            console.log('--- Scheduled Local Backup Started ---');
            try {
                await localBackupService.createDatabaseBackup(null, 'database');
                console.log('--- Scheduled Local Backup Completed Successfully ---');
            } catch (error) {
                console.error('--- Scheduled Local Backup Failed ---');
                console.error(error.message);
            }
        });
    }

    stop() {
        if (this.task) {
            this.task.stop();
            console.log('Backup Service: STOPPED');
        }
    }
}

module.exports = new BackupScheduler();
