const { db } = require('./config/db');
async function check() {
    try {
        const [rows] = await db.query("SELECT * FROM platform_settings");
        console.log('Settings:', rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
