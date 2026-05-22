const fs = require('fs');
const path = require('path');

function generateSeed() {
    console.log('Generating production seed file...');

    const fullSetupPath = path.join(__dirname, 'full_setup.sql');
    if (!fs.existsSync(fullSetupPath)) {
        console.error(`full_setup.sql not found at ${fullSetupPath}`);
        return;
    }

    const fullSetupContent = fs.readFileSync(fullSetupPath, 'utf8');

    // Extract the menu items INSERT statement
    const itemsRegex = /INSERT INTO items \([^)]+\)\s*VALUES\s*([\s\S]+?)(?=ON DUPLICATE KEY UPDATE|;)/i;
    const match = fullSetupContent.match(itemsRegex);

    if (!match) {
        console.error('Could not find items insert block in full_setup.sql');
        return;
    }

    const valuesBlock = match[1].trim();
    
    // Parse individual item values
    // Values look like: ('Rice and Curry', 'Rice & Curry', 300, 'Single', 'active', 'available', false),
    const itemRows = valuesBlock.split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('('))
        .map(line => {
            // Remove outer parentheses and trailing comma/semicolon
            let cleaned = line.replace(/^\(/, '').replace(/\),?$/, '');
            return cleaned;
        });

    let seedSql = [];
    seedSql.push('-- RestoLedger POS Multi-Tenant Production Seed Data');
    seedSql.push('-- Generated on: ' + new Date().toISOString());
    seedSql.push('');
    seedSql.push('SET FOREIGN_KEY_CHECKS = 0;');
    seedSql.push('');

    // 1. Seed subscription plans
    seedSql.push('-- 1. Seed Subscription Plans');
    seedSql.push('INSERT INTO `subscription_plans` (`id`, `name`, `plan_key`, `monthly_price`, `yearly_price`, `billing_interval`, `features`, `is_active`) VALUES');
    seedSql.push("(1, 'Standard', 'standard', 5000.00, 55000.00, 'monthly', '[\"Unlimited Items\", \"Basic Reporting\", \"Table Management\"]', 1),");
    seedSql.push("(2, 'Premium', 'premium', 12000.00, 130000.00, 'monthly', '[\"Everything in Standard\", \"Advanced Analytics\", \"Multi-user Access\", \"Priority Support\"]', 1)");
    seedSql.push('ON DUPLICATE KEY UPDATE name=VALUES(name), monthly_price=VALUES(monthly_price);');
    seedSql.push('');

    // 2. Seed Default Shop (id = 1)
    seedSql.push('-- 2. Seed Default Shop');
    seedSql.push('INSERT INTO `shops` (`id`, `uuid`, `name`, `slug`, `identifier`, `status`, `subscription_status`, `subscription_plan`, `subscription_end_date`, `grace_until`) VALUES');
    seedSql.push("(1, '3f8e6584-c8c3-4d6b-bd85-e7f01a0989f5', 'Existing Demo Shop', 'demo', 'demo', 'active', 'active', 'standard', DATE_ADD(CURDATE(), INTERVAL 12 MONTH), DATE_ADD(CURDATE(), INTERVAL 12 MONTH + 7 DAY))");
    seedSql.push('ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status);');
    seedSql.push('');

    // 3. Seed Users (Passwords are admin123)
    seedSql.push('-- 3. Seed Users (Passwords are admin123)');
    seedSql.push('INSERT INTO `users` (`id`, `shop_id`, `uuid`, `name`, `email`, `password`, `role`, `status`) VALUES');
    seedSql.push("(70, 1, '8d234a94-4d8e-49b8-bd2e-503db3d288a7', 'Platform Owner', 'superadmin@restopos.com', '$2b$10$q2Ig5oXI6k500V/1R5KaY.FE09iSWDHr6B6O7YCJILMhwBuCHVife', 'super_admin', 'active'),");
    seedSql.push("(2, 1, '23f6c8d4-8ab3-4df4-bd0b-4de02bc923a1', 'System Admin', 'admin@restopos.com', '$2b$10$q2Ig5oXI6k500V/1R5KaY.FE09iSWDHr6B6O7YCJILMhwBuCHVife', 'admin', 'active'),");
    seedSql.push("(3, 1, '33f6c8d4-8ab3-4df4-bd0b-4de02bc923a2', 'Store Manager', 'manager@restopos.com', '$2b$10$q2Ig5oXI6k500V/1R5KaY.FE09iSWDHr6B6O7YCJILMhwBuCHVife', 'manager', 'active'),");
    seedSql.push("(4, 1, '43f6c8d4-8ab3-4df4-bd0b-4de02bc923a3', 'Main Cashier', 'cashier@restopos.com', '$2b$10$q2Ig5oXI6k500V/1R5KaY.FE09iSWDHr6B6O7YCJILMhwBuCHVife', 'cashier', 'active'),");
    seedSql.push("(5, 1, '53f6c8d4-8ab3-4df4-bd0b-4de02bc923a4', 'Senior Waiter', 'waiter@restopos.com', '$2b$10$q2Ig5oXI6k500V/1R5KaY.FE09iSWDHr6B6O7YCJILMhwBuCHVife', 'waiter', 'active'),");
    seedSql.push("(6, 1, '63f6c8d4-8ab3-4df4-bd0b-4de02bc923a5', 'Head Chef', 'kitchen@restopos.com', '$2b$10$q2Ig5oXI6k500V/1R5KaY.FE09iSWDHr6B6O7YCJILMhwBuCHVife', 'kitchen', 'active')");
    seedSql.push('ON DUPLICATE KEY UPDATE password=VALUES(password), role=VALUES(role), status=VALUES(status);');
    seedSql.push('');

    // 4. Seed Settings
    seedSql.push('-- 4. Seed Settings');
    seedSql.push('INSERT INTO `settings` (`shop_id`, `setting_key`, `setting_value`, `setting_type`, `group_name`, `label`, `description`) VALUES');
    seedSql.push("(1, 'restaurant_name', 'RestoLedger POS', 'string', 'general', 'Restaurant Name', 'Name of the restaurant'),");
    seedSql.push("(1, 'restaurant_address', '123 POS Street, City', 'string', 'general', 'Restaurant Address', 'Physical address of the restaurant'),");
    seedSql.push("(1, 'restaurant_phone', '0112345678', 'string', 'general', 'Restaurant Phone', 'Contact phone number'),");
    seedSql.push("(1, 'currency_symbol', 'Rs.', 'string', 'general', 'Currency Symbol', 'Symbol of currency used'),");
    seedSql.push("(1, 'receipt_footer_message', 'Thank you for dining with us!', 'string', 'general', 'Receipt Footer Message', 'Message printed at the bottom of receipts'),");
    seedSql.push("(1, 'service_charge_enabled', 'true', 'boolean', 'general', 'Enable Service Charge', 'Whether service charge is applied to bills'),");
    seedSql.push("(1, 'service_charge_rate', '10', 'number', 'general', 'Service Charge Rate', 'Percentage of service charge'),");
    seedSql.push("(1, 'tax_enabled', 'false', 'boolean', 'general', 'Enable Tax', 'Whether government tax is applied to bills'),");
    seedSql.push("(1, 'tax_rate', '0', 'number', 'general', 'Tax Rate', 'Percentage of tax charge'),");
    seedSql.push("(1, 'stock_tracking_enabled', 'true', 'boolean', 'general', 'Enable Stock Tracking', 'Track inventory stock levels dynamically'),");
    seedSql.push("(1, 'shift_enforcement_enabled', 'false', 'boolean', 'general', 'Enable Shift Enforcement', 'Whether shifts are required to open cashier station'),");
    seedSql.push("(1, 'kot_printing_enabled', 'true', 'boolean', 'general', 'Enable KOT Printing', 'Print kitchen order tickets'),");
    seedSql.push("(1, 'discount_approval_limit', '500', 'number', 'general', 'Discount Approval Limit', 'Maximum discount amount cashier can apply without manager approval'),");
    seedSql.push("(1, 'offline_conflict_manual_review_required', 'true', 'boolean', 'general', 'Offline Manual Review Required', 'Manual review needed for offline data sync conflicts'),");
    seedSql.push("(1, 'offline_allow_price_change_sync', 'true', 'boolean', 'general', 'Offline Allow Price Change Sync', 'Allow price changes to sync from offline drafts'),");
    seedSql.push("(1, 'offline_max_retry_count', '5', 'number', 'general', 'Offline Max Retry Count', 'Maximum sync retry attempts'),");
    seedSql.push("(1, 'offline_failed_draft_retention_days', '14', 'number', 'general', 'Offline Failed Draft Retention Days', 'Days to keep failed offline drafts in sync logs'),");
    seedSql.push("(1, 'offline_auto_sync_non_conflicting', 'false', 'boolean', 'general', 'Offline Auto Sync Non Conflicting', 'Auto sync clean offline drafts')");
    seedSql.push('ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);');
    seedSql.push('');

    // 5. Seed Restaurant Tables
    seedSql.push('-- 5. Seed Restaurant Tables');
    seedSql.push('INSERT INTO `restaurant_tables` (`shop_id`, `table_no`, `capacity`, `status`, `uuid`) VALUES');
    seedSql.push("(1, 'T-01', 2, 'available', 'table-01-uuid-placeholder-1111-2222'),");
    seedSql.push("(1, 'T-02', 2, 'available', 'table-02-uuid-placeholder-1111-2222'),");
    seedSql.push("(1, 'T-03', 4, 'available', 'table-03-uuid-placeholder-1111-2222'),");
    seedSql.push("(1, 'T-04', 4, 'available', 'table-04-uuid-placeholder-1111-2222'),");
    seedSql.push("(1, 'T-05', 4, 'available', 'table-05-uuid-placeholder-1111-2222'),");
    seedSql.push("(1, 'T-06', 6, 'available', 'table-06-uuid-placeholder-1111-2222')");
    seedSql.push('ON DUPLICATE KEY UPDATE capacity=VALUES(capacity), status=VALUES(status);');
    seedSql.push('');

    // 6. Seed Items
    seedSql.push('-- 6. Seed Menu Items');
    seedSql.push('INSERT INTO `items` (`shop_id`, `uuid`, `name`, `category`, `price`, `portion_label`, `status`, `availability_status`, `track_stock`) VALUES');
    
    const seededItems = [];
    itemRows.forEach((rowContent, idx) => {
        // Generate a pseudo-uuid or query string for UUID
        const itemUuid = `item-uuid-placeholder-1000-2000-3000-${1000 + idx}`;
        const suffix = idx === itemRows.length - 1 ? ';' : ',';
        seededItems.push(`(1, '${itemUuid}', ${rowContent})${suffix}`);
    });
    
    seedSql = seedSql.concat(seededItems);
    seedSql.push('');
    seedSql.push('SET FOREIGN_KEY_CHECKS = 1;');
    seedSql.push('');

    const outputSeedPath = path.join(__dirname, 'production_seed.sql');
    fs.writeFileSync(outputSeedPath, seedSql.join('\n'), 'utf8');
    console.log(`✔ Production seed file written successfully to: ${outputSeedPath}`);
}

generateSeed();
