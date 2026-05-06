const { db } = require('../../config/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
    console.log('Starting Multi-Tenant Migration...');

    try {
        // 1. Create shops table
        await db.query(`
            CREATE TABLE IF NOT EXISTS shops (
                id INT AUTO_INCREMENT PRIMARY KEY,
                uuid CHAR(36) UNIQUE NOT NULL,
                name VARCHAR(150) NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                subdomain VARCHAR(100) UNIQUE NULL,
                phone VARCHAR(30) NULL,
                address TEXT NULL,
                status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
                plan VARCHAR(50) DEFAULT 'standard',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✔ Shops table created');

        // 2. Create Default Shop if not exists
        const [existingShops] = await db.query("SELECT id FROM shops WHERE slug = 'demo'");
        if (existingShops.length === 0) {
            await db.query("INSERT INTO shops (uuid, name, slug, status) VALUES (UUID(), 'Existing Demo Shop', 'demo', 'active')");
            console.log('✔ Default shop created');
        }
        
        const [demoShop] = await db.query("SELECT id FROM shops WHERE slug = 'demo'");
        const defaultShopId = demoShop[0].id;

        // 3. Get all tables
        const [tables] = await db.query('SHOW TABLES');
        const dbName = process.env.DB_NAME || 'restoledgerdb';
        const tableKey = `Tables_in_${dbName}`;

        for (const row of tables) {
            const tableName = row[tableKey] || Object.values(row)[0];
            
            if (['shops', 'backup_logs', 'promotion_usage'].includes(tableName)) continue;

            // Check if shop_id exists
            const [columns] = await db.query(`SHOW COLUMNS FROM \`${tableName}\` LIKE 'shop_id'`);
            
            if (columns.length === 0) {
                console.log(`- Scoping table: ${tableName}`);
                await db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN shop_id INT NULL AFTER id`);
                await db.query(`UPDATE \`${tableName}\` SET shop_id = ?`, [defaultShopId]);
                await db.query(`ALTER TABLE \`${tableName}\` ADD INDEX (shop_id)`);
            }
        }
        console.log('✔ All business tables scoped by shop_id');

        // 4. Update Settings PK
        try {
            await db.query('ALTER TABLE settings DROP PRIMARY KEY');
            await db.query('ALTER TABLE settings ADD PRIMARY KEY (shop_id, setting_key)');
            console.log('✔ Settings primary key updated');
        } catch (e) {
            console.log('! Settings PK update skipped (might already be updated)');
        }

        // 5. Update roles
        await db.query("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'admin', 'manager', 'cashier', 'waiter', 'kitchen') DEFAULT 'cashier'");
        console.log('✔ User roles updated');

        console.log('\nMigration COMPLETED successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration FAILED:', err);
        process.exit(1);
    }
}

migrate();
