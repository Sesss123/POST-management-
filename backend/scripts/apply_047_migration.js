const { db } = require('../config/db');

async function migrate() {
    console.log('--- Starting Phase 12: Employee Permissions Migration ---');
    
    try {
        // 1. Create permissions table
        await db.query(`
            CREATE TABLE IF NOT EXISTS permissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                perm_key VARCHAR(100) UNIQUE NOT NULL,
                name VARCHAR(150) NOT NULL,
                category VARCHAR(50) NOT NULL,
                description TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Create role_permissions table
        await db.query(`
            CREATE TABLE IF NOT EXISTS role_permissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                shop_id INT NOT NULL,
                role VARCHAR(50) NOT NULL,
                permission_id INT NOT NULL,
                FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
                INDEX idx_shop_role (shop_id, role)
            )
        `);

        // 3. Create user_permissions table (overrides)
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_permissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                shop_id INT NOT NULL,
                user_id INT NOT NULL,
                permission_id INT NOT NULL,
                value BOOLEAN NOT NULL DEFAULT TRUE,
                FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_shop_user (shop_id, user_id)
            )
        `);

        // 4. Seed initial permissions
        const perms = [
            ['pos.cash_sale', 'Perform Cash Sales', 'Sales', 'Access to Quick Retail screen'],
            ['pos.table_billing', 'Manage Table Billing', 'Sales', 'Open/Close table sessions'],
            ['invoice.cancel', 'Cancel Invoices', 'Sales', 'Full cancellation of transactions'],
            ['invoice.view', 'View Invoice History', 'Sales', 'Browse past transactions'],
            ['naya.view', 'View Naya Book', 'Accounting', 'Access credit ledger'],
            ['naya.settle', 'Settle Naya Balances', 'Accounting', 'Record debt payments'],
            ['expenses.manage', 'Manage Expenses', 'Operations', 'Record daily costs'],
            ['items.manage', 'Manage Menu Items', 'Inventory', 'Edit items and pricing'],
            ['settings.manage', 'Shop Settings', 'Admin', 'Modify shop configuration'],
            ['reports.view', 'View Reports', 'Admin', 'Access BI and analytics'],
            ['users.manage', 'Manage Employees', 'Admin', 'User accounts and permissions']
        ];

        for (const [key, name, cat, desc] of perms) {
            await db.query(
                'INSERT IGNORE INTO permissions (perm_key, name, category, description) VALUES (?, ?, ?, ?)',
                [key, name, cat, desc]
            );
        }

        console.log('--- Migration Complete ---');
        process.exit(0);
    } catch (error) {
        console.error('Migration Failed:', error);
        process.exit(1);
    }
}

migrate();
