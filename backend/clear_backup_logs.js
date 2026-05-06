const { db } = require('./config/db');
async function clear() {
    try {
        await db.query("TRUNCATE TABLE backup_logs");
        console.log('Table truncated');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
clear();
