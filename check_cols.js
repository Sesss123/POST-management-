const { db } = require('./backend/config/db');

async function checkColumns() {
    try {
        const [rows] = await db.query('DESC shops');
        rows.forEach(r => console.log(r.Field));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkColumns();
