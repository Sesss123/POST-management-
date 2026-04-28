-- RestoLedger POS Upgrade Migration 001
-- This migration ensures all required MySQL tables are present and correctly configured.

USE restoledger_pos;

-- Ensure settings table uses the correct column names
-- Since renaming a primary key column in a migration can be tricky if data exists, 
-- we check if key_name exists and rename it if so.
SET @dbname = DATABASE();
SET @tablename = "settings";
SET @columnname = "key_name";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname) > 0,
  'ALTER TABLE settings CHANGE key_name setting_key VARCHAR(255)',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure value column is renamed to setting_value
SET @columnname = "value";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname) > 0,
  'ALTER TABLE settings CHANGE value setting_value TEXT',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure customer_ledger has 'debit' in ENUM
-- Note: MySQL 8+ supports modifying ENUMs without too much pain
ALTER TABLE customer_ledger MODIFY COLUMN type ENUM('debit', 'credit', 'payment', 'adjustment') NOT NULL;

-- Ensure kot_items has status column
SET @tablename = "kot_items";
SET @columnname = "status";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname) = 0,
  'ALTER TABLE kot_items ADD COLUMN status ENUM("pending", "preparing", "ready", "served") DEFAULT "pending"',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure customers has nic column
SET @tablename = "customers";
SET @columnname = "nic";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname) = 0,
  'ALTER TABLE customers ADD COLUMN nic VARCHAR(20) UNIQUE AFTER email',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add any missing tables from the full list
CREATE TABLE IF NOT EXISTS invoice_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT,
    payment_method ENUM('cash', 'card', 'bank', 'qr', 'credit') DEFAULT 'cash',
    amount DECIMAL(10, 2) NOT NULL,
    reference_no VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- Seed default settings if missing
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES 
('restaurant_name', 'RestoLedger POS'),
('restaurant_address', '123 POS Street, City'),
('restaurant_phone', '0112345678'),
('currency_symbol', 'Rs.'),
('receipt_footer_message', 'Thank you for dining with us!'),
('service_charge_enabled', 'true'),
('service_charge_rate', '10'),
('tax_enabled', 'false'),
('tax_rate', '0'),
('stock_tracking_enabled', 'true'),
('shift_enforcement_enabled', 'false'),
('kot_printing_enabled', 'true'),
('discount_approval_limit', '500');
