const { db } = require('./config/db');

async function checkSchema() {
    try {
        const [columns] = await db.query('DESCRIBE items');
        console.log(JSON.stringify(columns, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
