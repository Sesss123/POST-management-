const { db } = require('./config/db');
async function check() {
    const [rows] = await db.query('SELECT name, short_code FROM items WHERE short_code = 0 OR short_code = "0"');
    console.log(rows);
    process.exit(0);
}
check();
