const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config({ path: fs.existsSync('.env') ? '.env' : '../.env' });

async function migrateRoles() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Migrating roles...');
        
        // Map old roles
        const [res1] = await connection.execute('UPDATE users SET role = "admin" WHERE role = "manager"');
        console.log(`Updated ${res1.affectedRows} managers to admin.`);
        
        const [res2] = await connection.execute('UPDATE users SET role = "cashier" WHERE role = "waiter"');
        console.log(`Updated ${res2.affectedRows} waiters to cashier.`);

        // Update any others to cashier just in case (safe default)
        const [res3] = await connection.execute('UPDATE users SET role = "cashier" WHERE role NOT IN ("admin", "cashier", "kitchen")');
        if (res3.affectedRows > 0) {
            console.log(`Updated ${res3.affectedRows} unknown roles to cashier.`);
        }

        console.log('Updating enum definition...');
        // We might need to handle the case where the enum change fails due to existing invalid values, 
        // but since we updated them above, it should be fine.
        await connection.execute('ALTER TABLE users MODIFY COLUMN role ENUM("admin", "cashier", "kitchen") DEFAULT "cashier"');
        
        console.log('Migration complete successfully.');
    } catch (error) {
        console.error('Migration failed:', error.message);
    } finally {
        await connection.end();
    }
}

migrateRoles();
