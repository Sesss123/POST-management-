const { db } = require('./config/db');
async function fix() {
    try {
        console.log('Fixing backup_logs table...');
        
        // Add uuid if not exists
        const [cols] = await db.query("SHOW COLUMNS FROM backup_logs");
        const colNames = cols.map(c => c.Field);
        
        if (!colNames.includes('uuid')) {
            console.log('Adding uuid column...');
            await db.query("ALTER TABLE backup_logs ADD COLUMN uuid VARCHAR(36) NOT NULL AFTER id");
            await db.query("ALTER TABLE backup_logs ADD UNIQUE KEY (uuid)");
        }
        
        if (!colNames.includes('file_size_mb')) {
            console.log('Adding file_size_mb column...');
            await db.query("ALTER TABLE backup_logs ADD COLUMN file_size_mb DECIMAL(10, 2) DEFAULT 0 AFTER error_message");
        }
        
        if (!colNames.includes('created_by')) {
            console.log('Adding created_by column...');
            await db.query("ALTER TABLE backup_logs ADD COLUMN created_by INT NULL AFTER file_size_mb");
        }
        
        console.log('Table fixed successfully');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
fix();
