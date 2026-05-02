const localBackupService = require('../services/localBackupService');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function manualBackup() {
    console.log('==================================================');
    console.log('RestoLedger POS - Manual Local Database Backup');
    console.log('==================================================');

    try {
        const result = await localBackupService.createDatabaseBackup(1, 'manual');
        console.log('\nSUCCESS!');
        console.log(`File Name: ${result.fileName}`);
        console.log(`Location:  ${result.filePath}`);
        console.log(`File Size: ${result.sizeMb} MB`);
        console.log('\nBackup process completed successfully.');
    } catch (error) {
        console.error('\nBACKUP FAILED');
        console.error('Error:', error.message);
        process.exit(1);
    }
}

manualBackup();
