const localBackupService = require('../services/localBackupService');
const { db } = require('../config/db');

// @desc    Run manual backup
// @route   POST /api/backups/run
// @access  Private/Admin
exports.runManualBackup = async (req, res) => {
    const { logAction } = require('../utils/logger');
    await logAction(req.user.id, 'backup_manual_started', 'backup', null, null, {});
    
    try {
        const result = await localBackupService.createDatabaseBackup(req.user.id, 'manual');
        
        await logAction(req.user.id, 'backup_manual_completed', 'backup', null, null, { fileName: result.fileName, size: result.sizeMb });

        res.json({
            success: true,
            message: 'Manual local backup completed successfully',
            data: result
        });
    } catch (error) {
        console.error('Manual Backup API Error:', error.message);
        await logAction(req.user.id, 'backup_manual_failed', 'backup', null, null, { error: error.message });
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get backup logs
// @route   GET /api/backups/logs
// @access  Private/Admin
exports.getBackupLogs = async (req, res) => {
    try {
        const [logs] = await db.query('SELECT * FROM backup_logs ORDER BY created_at DESC LIMIT 50');
        res.json({ success: true, data: logs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get backup status
// @route   GET /api/backups/status
// @access  Private/Admin
exports.getBackupStatus = async (req, res) => {
    try {
        const enabled = process.env.BACKUP_ENABLED === 'true';
        const cron = process.env.BACKUP_CRON || '30 23 * * *';
        const retention = process.env.BACKUP_RETENTION_DAYS || 14;
        const backupDir = process.env.BACKUP_LOCAL_DIR || 'database/backups';

        const [lastBackup] = await db.query('SELECT created_at, status FROM backup_logs ORDER BY created_at DESC LIMIT 1');

        res.json({
            success: true,
            data: {
                enabled,
                cron,
                retention,
                backupDir,
                lastBackup: lastBackup.length > 0 ? lastBackup[0] : null
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
