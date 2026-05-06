const { db } = require('./config/db');
async function check() {
    try {
        const [rows] = await db.query("SHOW TABLES LIKE 'platform_settings'");
        console.log('Tables:', rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
