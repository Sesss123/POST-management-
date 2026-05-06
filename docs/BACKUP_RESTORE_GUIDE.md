# Backup & Disaster Recovery Guide

RestoLedger POS includes automated and manual backup mechanisms to ensure data durability.

## 1. Automated Backups
- **Frequency**: Daily (at 00:00 server time).
- **Storage**: Saved in the `backend/backups/` directory.
- **Retention**: Controlled by the `backup_retention_days` setting (default 30 days).
- **Monitoring**: Check the "Backups" page in the Admin Dashboard for success/failure logs.

## 2. Manual Backup (CLI)
To manually dump the database on the server:
```bash
mysqldump -u ledger_admin -p restoledger > manual_backup_$(date +%F).sql
```

## 3. Restoring from a Backup
> [!CAUTION]
> Restoring a backup will overwrite current database data. Always take a fresh backup before performing a restore.

1. Locate the `.sql` file you wish to restore.
2. Run the import command:
   ```bash
   mysql -u ledger_admin -p restoledger < path/to/backup_file.sql
   ```
3. Restart the PM2 process to refresh any cached settings:
   ```bash
   pm2 restart restoledger-api
   ```

## 4. Troubleshooting Backups
- **Error: mysqldump not found**: Ensure `mysql-client` is installed and in the system PATH.
- **Permission Denied**: Ensure the system user running the Node.js process has write permissions to the `backups/` folder.
- **Disk Full**: Monitor VPS disk space. Large shops with many years of data may generate large dumps.

## 5. Off-site Storage (Recommended)
It is highly recommended to periodically download the backup files to an off-site location (e.g., local PC or cloud storage) to protect against VPS hardware failure.
