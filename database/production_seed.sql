-- RestoLedger POS Multi-Tenant Production Seed Data
-- Generated on: 2026-05-22T21:02:27.723Z

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Seed Subscription Plans
INSERT INTO `subscription_plans` (`id`, `name`, `plan_key`, `monthly_price`, `yearly_price`, `billing_interval`, `features`, `is_active`) VALUES
(1, 'Standard', 'standard', 5000.00, 55000.00, 'monthly', '["Unlimited Items", "Basic Reporting", "Table Management"]', 1),
(2, 'Premium', 'premium', 12000.00, 130000.00, 'monthly', '["Everything in Standard", "Advanced Analytics", "Multi-user Access", "Priority Support"]', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), monthly_price=VALUES(monthly_price);

-- 2. Seed Default Shop
INSERT INTO `shops` (`id`, `uuid`, `name`, `slug`, `identifier`, `status`, `subscription_status`, `subscription_plan`, `subscription_end_date`, `grace_until`) VALUES
(1, '3f8e6584-c8c3-4d6b-bd85-e7f01a0989f5', 'Existing Demo Shop', 'demo', 'demo', 'active', 'active', 'standard', DATE_ADD(CURDATE(), INTERVAL 12 MONTH), DATE_ADD(CURDATE(), INTERVAL 12 MONTH + 7 DAY))
ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status);

-- 3. Seed Users (Passwords are admin123)
INSERT INTO `users` (`id`, `shop_id`, `uuid`, `name`, `email`, `password`, `role`, `status`) VALUES
(70, 1, '8d234a94-4d8e-49b8-bd2e-503db3d288a7', 'Platform Owner', 'superadmin@restopos.com', '$2b$10$q2Ig5oXI6k500V/1R5KaY.FE09iSWDHr6B6O7YCJILMhwBuCHVife', 'super_admin', 'active'),
(2, 1, '23f6c8d4-8ab3-4df4-bd0b-4de02bc923a1', 'System Admin', 'admin@restopos.com', '$2b$10$q2Ig5oXI6k500V/1R5KaY.FE09iSWDHr6B6O7YCJILMhwBuCHVife', 'admin', 'active'),
(3, 1, '33f6c8d4-8ab3-4df4-bd0b-4de02bc923a2', 'Store Manager', 'manager@restopos.com', '$2b$10$q2Ig5oXI6k500V/1R5KaY.FE09iSWDHr6B6O7YCJILMhwBuCHVife', 'manager', 'active'),
(4, 1, '43f6c8d4-8ab3-4df4-bd0b-4de02bc923a3', 'Main Cashier', 'cashier@restopos.com', '$2b$10$q2Ig5oXI6k500V/1R5KaY.FE09iSWDHr6B6O7YCJILMhwBuCHVife', 'cashier', 'active'),
(5, 1, '53f6c8d4-8ab3-4df4-bd0b-4de02bc923a4', 'Senior Waiter', 'waiter@restopos.com', '$2b$10$q2Ig5oXI6k500V/1R5KaY.FE09iSWDHr6B6O7YCJILMhwBuCHVife', 'waiter', 'active'),
(6, 1, '63f6c8d4-8ab3-4df4-bd0b-4de02bc923a5', 'Head Chef', 'kitchen@restopos.com', '$2b$10$q2Ig5oXI6k500V/1R5KaY.FE09iSWDHr6B6O7YCJILMhwBuCHVife', 'kitchen', 'active')
ON DUPLICATE KEY UPDATE password=VALUES(password), role=VALUES(role), status=VALUES(status);

-- 4. Seed Settings
INSERT INTO `settings` (`shop_id`, `setting_key`, `setting_value`, `setting_type`, `group_name`, `label`, `description`) VALUES
(1, 'restaurant_name', 'RestoLedger POS', 'string', 'general', 'Restaurant Name', 'Name of the restaurant'),
(1, 'restaurant_address', '123 POS Street, City', 'string', 'general', 'Restaurant Address', 'Physical address of the restaurant'),
(1, 'restaurant_phone', '0112345678', 'string', 'general', 'Restaurant Phone', 'Contact phone number'),
(1, 'currency_symbol', 'Rs.', 'string', 'general', 'Currency Symbol', 'Symbol of currency used'),
(1, 'receipt_footer_message', 'Thank you for dining with us!', 'string', 'general', 'Receipt Footer Message', 'Message printed at the bottom of receipts'),
(1, 'service_charge_enabled', 'true', 'boolean', 'general', 'Enable Service Charge', 'Whether service charge is applied to bills'),
(1, 'service_charge_rate', '10', 'number', 'general', 'Service Charge Rate', 'Percentage of service charge'),
(1, 'tax_enabled', 'false', 'boolean', 'general', 'Enable Tax', 'Whether government tax is applied to bills'),
(1, 'tax_rate', '0', 'number', 'general', 'Tax Rate', 'Percentage of tax charge'),
(1, 'stock_tracking_enabled', 'true', 'boolean', 'general', 'Enable Stock Tracking', 'Track inventory stock levels dynamically'),
(1, 'shift_enforcement_enabled', 'false', 'boolean', 'general', 'Enable Shift Enforcement', 'Whether shifts are required to open cashier station'),
(1, 'kot_printing_enabled', 'true', 'boolean', 'general', 'Enable KOT Printing', 'Print kitchen order tickets'),
(1, 'discount_approval_limit', '500', 'number', 'general', 'Discount Approval Limit', 'Maximum discount amount cashier can apply without manager approval'),
(1, 'offline_conflict_manual_review_required', 'true', 'boolean', 'general', 'Offline Manual Review Required', 'Manual review needed for offline data sync conflicts'),
(1, 'offline_allow_price_change_sync', 'true', 'boolean', 'general', 'Offline Allow Price Change Sync', 'Allow price changes to sync from offline drafts'),
(1, 'offline_max_retry_count', '5', 'number', 'general', 'Offline Max Retry Count', 'Maximum sync retry attempts'),
(1, 'offline_failed_draft_retention_days', '14', 'number', 'general', 'Offline Failed Draft Retention Days', 'Days to keep failed offline drafts in sync logs'),
(1, 'offline_auto_sync_non_conflicting', 'false', 'boolean', 'general', 'Offline Auto Sync Non Conflicting', 'Auto sync clean offline drafts')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- 5. Seed Restaurant Tables
INSERT INTO `restaurant_tables` (`shop_id`, `table_no`, `capacity`, `status`, `uuid`) VALUES
(1, 'T-01', 2, 'available', 'table-01-uuid-placeholder-1111-2222'),
(1, 'T-02', 2, 'available', 'table-02-uuid-placeholder-1111-2222'),
(1, 'T-03', 4, 'available', 'table-03-uuid-placeholder-1111-2222'),
(1, 'T-04', 4, 'available', 'table-04-uuid-placeholder-1111-2222'),
(1, 'T-05', 4, 'available', 'table-05-uuid-placeholder-1111-2222'),
(1, 'T-06', 6, 'available', 'table-06-uuid-placeholder-1111-2222')
ON DUPLICATE KEY UPDATE capacity=VALUES(capacity), status=VALUES(status);

-- 6. Seed Menu Items
INSERT INTO `items` (`shop_id`, `uuid`, `name`, `category`, `price`, `portion_label`, `status`, `availability_status`, `track_stock`) VALUES
(1, 'item-uuid-placeholder-1000-2000-3000-1000', 'Rice and Curry', 'Rice & Curry', 300, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1001', 'Rice and Curry Fish', 'Rice & Curry', 450, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1002', 'Rice and Curry Chicken', 'Rice & Curry', 450, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1003', 'Rice and Curry Beef', 'Rice & Curry', 700, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1004', 'Rice and Curry Pork', 'Rice & Curry', 700, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1005', 'String Hoppers with Dhal Curry', 'String Hoppers', 300, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1006', 'Boiled Egg', 'Eggs & Extras', 60, '1 Egg', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1007', 'Bullseye Egg', 'Eggs & Extras', 100, '1 Egg', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1008', 'Omelette 2 Eggs', 'Eggs & Extras', 250, '2 Eggs', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1009', 'Vegetable Fried Rice', 'Fried Rice - Single Portion', 500, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1010', 'Egg Fried Rice', 'Fried Rice - Single Portion', 600, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1011', 'Chicken Fried Rice', 'Fried Rice - Single Portion', 750, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1012', 'Pork Fried Rice', 'Fried Rice - Single Portion', 950, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1013', 'Beef Fried Rice', 'Fried Rice - Single Portion', 900, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1014', 'Seafood Fried Rice', 'Fried Rice - Single Portion', 1000, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1015', 'Mixed Fried Rice', 'Fried Rice - Single Portion', 1100, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1016', 'Vegetable Fried Rice Large', 'Fried Rice - Double Portion', 850, 'Double', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1017', 'Egg Fried Rice Large', 'Fried Rice - Double Portion', 900, 'Double', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1018', 'Chicken Fried Rice Large', 'Fried Rice - Double Portion', 1350, 'Double', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1019', 'Pork Fried Rice Large', 'Fried Rice - Double Portion', 1600, 'Double', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1020', 'Beef Fried Rice Large', 'Fried Rice - Double Portion', 1550, 'Double', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1021', 'Seafood Fried Rice Large', 'Fried Rice - Double Portion', 1850, 'Double', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1022', 'Mixed Fried Rice Large', 'Fried Rice - Double Portion', 1950, 'Double', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1023', 'Vegetable Noodles', 'Noodles - Single Portion', 500, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1024', 'Egg Noodles', 'Noodles - Single Portion', 600, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1025', 'Chicken Noodles', 'Noodles - Single Portion', 750, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1026', 'Pork Noodles', 'Noodles - Single Portion', 950, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1027', 'Beef Noodles', 'Noodles - Single Portion', 900, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1028', 'Seafood Noodles', 'Noodles - Single Portion', 1000, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1029', 'Mixed Noodles', 'Noodles - Single Portion', 1100, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1030', 'Vegetable Noodles Large', 'Noodles - Double Portion', 850, 'Double', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1031', 'Egg Noodles Large', 'Noodles - Double Portion', 900, 'Double', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1032', 'Chicken Noodles Large', 'Noodles - Double Portion', 1350, 'Double', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1033', 'Pork Noodles Large', 'Noodles - Double Portion', 1600, 'Double', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1034', 'Beef Noodles Large', 'Noodles - Double Portion', 1550, 'Double', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1035', 'Seafood Noodles Large', 'Noodles - Double Portion', 1850, 'Double', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1036', 'Mixed Noodles Large', 'Noodles - Double Portion', 1950, 'Double', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1037', 'Vegetable Kottu', 'Kottu - Single Portion', 500, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1038', 'Egg Kottu', 'Kottu - Single Portion', 600, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1039', 'Chicken Kottu', 'Kottu - Single Portion', 750, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1040', 'Pork Kottu', 'Kottu - Single Portion', 950, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1041', 'Beef Kottu', 'Kottu - Single Portion', 900, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1042', 'Seafood Kottu', 'Kottu - Single Portion', 1000, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1043', 'Mixed Kottu', 'Kottu - Single Portion', 1100, 'Single', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1044', 'Vegetable Kottu Large', 'Kottu - Double Portion', 850, 'Double', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1045', 'Egg Kottu Large', 'Kottu - Double Portion', 900, 'Double', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1046', 'Chicken Kottu Large', 'Kottu - Double Portion', 1350, 'Double', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1047', 'Pork Kottu Large', 'Kottu - Double Portion', 1600, 'Double', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1048', 'Beef Kottu Large', 'Kottu - Double Portion', 1550, 'Double', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1049', 'Seafood Kottu Large', 'Kottu - Double Portion', 1850, 'Double', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1050', 'Mixed Kottu Large', 'Kottu - Double Portion', 1950, 'Double', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1051', 'Devilled Chicken', 'Devilled / Stew / Fried - 250g', 750, '250g', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1052', 'Stew Chicken', 'Devilled / Stew / Fried - 250g', 750, '250g', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1053', 'Fried Chicken', 'Devilled / Stew / Fried - 250g', 750, '250g', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1054', 'Devilled Beef', 'Devilled / Stew / Fried - 250g', 900, '250g', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1055', 'Stew Beef', 'Devilled / Stew / Fried - 250g', 900, '250g', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1056', 'Fried Beef', 'Devilled / Stew / Fried - 250g', 900, '250g', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1057', 'Devilled Pork', 'Devilled / Stew / Fried - 250g', 1000, '250g', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1058', 'Stew Pork', 'Devilled / Stew / Fried - 250g', 1000, '250g', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1059', 'Fried Pork', 'Devilled / Stew / Fried - 250g', 1000, '250g', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1060', 'Devilled Fish', 'Devilled / Stew / Fried - 250g', 800, '250g', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1061', 'Stew Fish', 'Devilled / Stew / Fried - 250g', 800, '250g', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1062', 'Fried Fish', 'Devilled / Stew / Fried - 250g', 800, '250g', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1063', 'Hot Butter Cuttlefish', 'Seafood Specials', 950, '250g', 'active', 'available', false),
(1, 'item-uuid-placeholder-1000-2000-3000-1064', 'Hot Butter Prawns', 'Seafood Specials', 1200, '250g', 'active', 'available', false);

SET FOREIGN_KEY_CHECKS = 1;
