-- RestoLedger POS Full Database Setup
-- This script creates the database, all tables, initial settings, and seeds the real menu.

CREATE DATABASE IF NOT EXISTS restoledgerdb;
USE restoledgerdb;

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'cashier', 'waiter', 'kitchen') DEFAULT 'cashier',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Items
CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) DEFAULT 0,
    track_stock BOOLEAN DEFAULT FALSE,
    stock_qty DECIMAL(10, 2) DEFAULT 0,
    low_stock_threshold DECIMAL(10, 2) DEFAULT 0,
    portion_label VARCHAR(50) NULL,
    description TEXT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    availability_status ENUM('available', 'sold_out', 'temporarily_unavailable') DEFAULT 'available',
    combo_id INT NULL, -- For items belonging to a combo (legacy ref)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT unique_name_category UNIQUE (name, category)
);

-- 3. Customers
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    nic VARCHAR(20) UNIQUE,
    address TEXT,
    credit_limit DECIMAL(15, 2) DEFAULT 0.00,
    current_balance DECIMAL(15, 2) DEFAULT 0.00,
    status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Restaurant Tables
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_no VARCHAR(50) UNIQUE NOT NULL,
    capacity INT DEFAULT 4,
    status ENUM('available', 'occupied', 'reserved', 'cleaning', 'billing') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. Table Sessions
CREATE TABLE IF NOT EXISTS table_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_no VARCHAR(50) UNIQUE NOT NULL,
    table_id INT NOT NULL,
    customer_id INT NULL,
    order_type ENUM('dine_in', 'takeaway', 'delivery') DEFAULT 'dine_in',
    waiter_id INT NULL,
    status ENUM('open', 'billed', 'paid', 'credit', 'cancelled') DEFAULT 'open',
    opened_by INT,
    closed_by INT NULL,
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (opened_by) REFERENCES users(id),
    FOREIGN KEY (closed_by) REFERENCES users(id),
    FOREIGN KEY (waiter_id) REFERENCES users(id)
);

-- 6. Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    item_id INT NULL,
    combo_id INT NULL,
    item_name VARCHAR(255) NOT NULL,
    qty INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(15, 2) NOT NULL,
    kot_sent BOOLEAN DEFAULT FALSE,
    note TEXT NULL,
    status ENUM('active', 'voided', 'served', 'cancelled', 'billed') DEFAULT 'active',
    void_reason TEXT NULL,
    waiter_id INT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES table_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (waiter_id) REFERENCES users(id)
);

-- 7. KOT Orders
CREATE TABLE IF NOT EXISTS kot_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kot_no VARCHAR(50) UNIQUE NOT NULL,
    table_id INT NULL,
    session_id INT NULL,
    order_type ENUM('dine_in', 'takeaway', 'delivery') NOT NULL,
    status ENUM('pending', 'preparing', 'ready', 'served', 'cancelled') DEFAULT 'pending',
    note TEXT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id),
    FOREIGN KEY (session_id) REFERENCES table_sessions(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 8. KOT Items
CREATE TABLE IF NOT EXISTS kot_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kot_id INT NOT NULL,
    item_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    qty INT NOT NULL,
    note TEXT NULL,
    status ENUM('pending', 'preparing', 'ready', 'served', 'cancelled') DEFAULT 'pending',
    FOREIGN KEY (kot_id) REFERENCES kot_orders(id) ON DELETE CASCADE
);

-- 9. Promotions
CREATE TABLE IF NOT EXISTS promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('percentage_discount', 'fixed_discount', 'buy_one_get_one') NOT NULL,
    value DECIMAL(10, 2) DEFAULT 0,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    applicable_order_type VARCHAR(255) DEFAULT 'all',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Combo Meals
CREATE TABLE IF NOT EXISTS combo_meals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS combo_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    combo_id INT NOT NULL,
    item_id INT NOT NULL,
    qty INT DEFAULT 1,
    FOREIGN KEY (combo_id) REFERENCES combo_meals(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id)
);

-- 11. Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NULL,
    table_id INT NULL,
    session_id INT NULL,
    invoice_type ENUM('cash_sale', 'table_sale', 'delivery', 'credit_sale') NOT NULL,
    order_type ENUM('dine_in', 'takeaway', 'delivery') DEFAULT 'takeaway',
    waiter_id INT NULL,
    payment_status ENUM('paid', 'unpaid', 'partially_paid', 'cancelled') DEFAULT 'unpaid',
    payment_method ENUM('cash', 'card', 'credit', 'split', 'mixed') DEFAULT 'cash',
    subtotal DECIMAL(15, 2) NOT NULL,
    discount_type ENUM('percentage', 'fixed') DEFAULT 'fixed',
    discount_value DECIMAL(15, 2) DEFAULT 0.00,
    discount DECIMAL(15, 2) DEFAULT 0.00,
    promotion_id INT NULL,
    promotion_discount_amount DECIMAL(15, 2) DEFAULT 0.00,
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,
    tax_amount DECIMAL(15, 2) DEFAULT 0.00,
    service_charge_rate DECIMAL(5, 2) DEFAULT 0.00,
    service_charge_amount DECIMAL(15, 2) DEFAULT 0.00,
    grand_total DECIMAL(15, 2) NOT NULL,
    paid_amount DECIMAL(15, 2) DEFAULT 0.00,
    balance_amount DECIMAL(15, 2) DEFAULT 0.00,
    cancel_reason TEXT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL,
    FOREIGN KEY (session_id) REFERENCES table_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (waiter_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL
);

-- 12. Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    item_id INT NULL,
    combo_id INT NULL,
    item_name VARCHAR(255) NOT NULL,
    qty INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(15, 2) NOT NULL,
    item_type ENUM('item', 'combo') DEFAULT 'item',
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- 13. Promotion Usage
CREATE TABLE IF NOT EXISTS promotion_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    promotion_id INT NOT NULL,
    invoice_id INT NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promotion_id) REFERENCES promotions(id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- 14. Invoice Payments
CREATE TABLE IF NOT EXISTS invoice_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    payment_method ENUM('cash', 'card', 'bank', 'qr', 'credit') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    reference_no VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- 14.1 General Customer Payments (Naya Payments)
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method ENUM('cash', 'card', 'bank', 'qr') NOT NULL,
    reference_no VARCHAR(100) NULL,
    note TEXT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 15. Customer Ledger
CREATE TABLE IF NOT EXISTS customer_ledger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    invoice_id INT NULL,
    type ENUM('debit', 'credit', 'payment', 'adjustment') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
);

-- 16. Held Bills
CREATE TABLE IF NOT EXISTS held_bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hold_no VARCHAR(50) UNIQUE,
    reference_name VARCHAR(255),
    customer_name VARCHAR(255) NULL,
    customer_phone VARCHAR(20) NULL,
    subtotal DECIMAL(15, 2) NOT NULL,
    discount DECIMAL(15, 2) DEFAULT 0.00,
    grand_total DECIMAL(15, 2) NOT NULL,
    status ENUM('held', 'resumed', 'cancelled', 'completed') DEFAULT 'held',
    cancel_reason TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS held_bill_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    held_bill_id INT NOT NULL,
    item_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    qty INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(15, 2) NOT NULL,
    note TEXT NULL,
    FOREIGN KEY (held_bill_id) REFERENCES held_bills(id) ON DELETE CASCADE
);

-- 17. Shifts
CREATE TABLE IF NOT EXISTS shifts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shift_no VARCHAR(50) UNIQUE,
    user_id INT NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    opening_cash DECIMAL(15, 2) NOT NULL,
    actual_cash DECIMAL(15, 2) DEFAULT 0.00,
    expected_cash DECIMAL(15, 2) DEFAULT 0.00,
    difference DECIMAL(15, 2) DEFAULT 0.00,
    status ENUM('open', 'closed') DEFAULT 'open',
    note TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 18. Cash Movements
CREATE TABLE IF NOT EXISTS cash_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shift_id INT NOT NULL,
    user_id INT NULL,
    type ENUM('cash_in', 'cash_out') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 19. Reservations
CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    guest_count INT DEFAULT 2,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    table_id INT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'seated', 'no_show') DEFAULT 'pending',
    note TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 20. Suppliers & Stock Procurement
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    address TEXT,
    current_balance DECIMAL(15, 2) DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_ledger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,
    type ENUM('purchase', 'payment', 'return', 'adjustment') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,
    reference_no VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_no VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INT NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    payment_status ENUM('paid', 'partial', 'unpaid') DEFAULT 'unpaid',
    payment_method VARCHAR(50) DEFAULT 'cash',
    received_by INT,
    received_date DATE,
    status ENUM('received', 'cancelled') DEFAULT 'received',
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (received_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT NOT NULL,
    item_id INT NOT NULL,
    qty DECIMAL(10, 2) NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    total DECIMAL(15, 2) NOT NULL,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id)
);

-- 21. Settings
CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(255) PRIMARY KEY,
    setting_value TEXT
);

-- 22. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INT,
    details TEXT,
    old_value JSON NULL,
    new_value JSON NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- SEED DATA ------------------------------------------------------------------

-- Default Users (Password for all: admin123)
INSERT INTO users (name, email, password, role) VALUES 
('System Admin', 'admin@restopos.com', '$2b$10$q2Ig5oXI6k500V/1R5KaY.FE09iSWDHr6B6O7YCJILMhwBuCHVife', 'admin'),
('Store Manager', 'manager@restopos.com', '$2b$10$q2Ig5oXI6k500V/1R5KaY.FE09iSWDHr6B6O7YCJILMhwBuCHVife', 'manager'),
('Main Cashier', 'cashier@restopos.com', '$2b$10$q2Ig5oXI6k500V/1R5KaY.FE09iSWDHr6B6O7YCJILMhwBuCHVife', 'cashier'),
('Senior Waiter', 'waiter@restopos.com', '$2b$10$q2Ig5oXI6k500V/1R5KaY.FE09iSWDHr6B6O7YCJILMhwBuCHVife', 'waiter'),
('Head Chef', 'kitchen@restopos.com', '$2b$10$q2Ig5oXI6k500V/1R5KaY.FE09iSWDHr6B6O7YCJILMhwBuCHVife', 'kitchen')
ON DUPLICATE KEY UPDATE password = VALUES(password), role = VALUES(role);

-- Default Settings
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

-- Default Tables
INSERT IGNORE INTO restaurant_tables (table_no, capacity) VALUES 
('T-01', 2), ('T-02', 2), ('T-03', 4), ('T-04', 4), ('T-05', 4), ('T-06', 6);

-- ANJU RESTAURANT MENU SEED ---------------------------------------------------
INSERT INTO items (name, category, price, portion_label, status, availability_status, track_stock)
VALUES 
('Rice and Curry', 'Rice & Curry', 300, 'Single', 'active', 'available', false),
('Rice and Curry Fish', 'Rice & Curry', 450, 'Single', 'active', 'available', false),
('Rice and Curry Chicken', 'Rice & Curry', 450, 'Single', 'active', 'available', false),
('Rice and Curry Beef', 'Rice & Curry', 700, 'Single', 'active', 'available', false),
('Rice and Curry Pork', 'Rice & Curry', 700, 'Single', 'active', 'available', false),
('String Hoppers with Dhal Curry', 'String Hoppers', 300, 'Single', 'active', 'available', false),
('Boiled Egg', 'Eggs & Extras', 60, '1 Egg', 'active', 'available', false),
('Bullseye Egg', 'Eggs & Extras', 100, '1 Egg', 'active', 'available', false),
('Omelette 2 Eggs', 'Eggs & Extras', 250, '2 Eggs', 'active', 'available', false),
('Vegetable Fried Rice', 'Fried Rice - Single Portion', 500, 'Single', 'active', 'available', false),
('Egg Fried Rice', 'Fried Rice - Single Portion', 600, 'Single', 'active', 'available', false),
('Chicken Fried Rice', 'Fried Rice - Single Portion', 750, 'Single', 'active', 'available', false),
('Pork Fried Rice', 'Fried Rice - Single Portion', 950, 'Single', 'active', 'available', false),
('Beef Fried Rice', 'Fried Rice - Single Portion', 900, 'Single', 'active', 'available', false),
('Seafood Fried Rice', 'Fried Rice - Single Portion', 1000, 'Single', 'active', 'available', false),
('Mixed Fried Rice', 'Fried Rice - Single Portion', 1100, 'Single', 'active', 'available', false),
('Vegetable Fried Rice Large', 'Fried Rice - Double Portion', 850, 'Double', 'active', 'available', false),
('Egg Fried Rice Large', 'Fried Rice - Double Portion', 900, 'Double', 'active', 'available', false),
('Chicken Fried Rice Large', 'Fried Rice - Double Portion', 1350, 'Double', 'active', 'available', false),
('Pork Fried Rice Large', 'Fried Rice - Double Portion', 1600, 'Double', 'active', 'available', false),
('Beef Fried Rice Large', 'Fried Rice - Double Portion', 1550, 'Double', 'active', 'available', false),
('Seafood Fried Rice Large', 'Fried Rice - Double Portion', 1850, 'Double', 'active', 'available', false),
('Mixed Fried Rice Large', 'Fried Rice - Double Portion', 1950, 'Double', 'active', 'available', false),
('Vegetable Noodles', 'Noodles - Single Portion', 500, 'Single', 'active', 'available', false),
('Egg Noodles', 'Noodles - Single Portion', 600, 'Single', 'active', 'available', false),
('Chicken Noodles', 'Noodles - Single Portion', 750, 'Single', 'active', 'available', false),
('Pork Noodles', 'Noodles - Single Portion', 950, 'Single', 'active', 'available', false),
('Beef Noodles', 'Noodles - Single Portion', 900, 'Single', 'active', 'available', false),
('Seafood Noodles', 'Noodles - Single Portion', 1000, 'Single', 'active', 'available', false),
('Mixed Noodles', 'Noodles - Single Portion', 1100, 'Single', 'active', 'available', false),
('Vegetable Noodles Large', 'Noodles - Double Portion', 850, 'Double', 'active', 'available', false),
('Egg Noodles Large', 'Noodles - Double Portion', 900, 'Double', 'active', 'available', false),
('Chicken Noodles Large', 'Noodles - Double Portion', 1350, 'Double', 'active', 'available', false),
('Pork Noodles Large', 'Noodles - Double Portion', 1600, 'Double', 'active', 'available', false),
('Beef Noodles Large', 'Noodles - Double Portion', 1550, 'Double', 'active', 'available', false),
('Seafood Noodles Large', 'Noodles - Double Portion', 1850, 'Double', 'active', 'available', false),
('Mixed Noodles Large', 'Noodles - Double Portion', 1950, 'Double', 'active', 'available', false),
('Vegetable Kottu', 'Kottu - Single Portion', 500, 'Single', 'active', 'available', false),
('Egg Kottu', 'Kottu - Single Portion', 600, 'Single', 'active', 'available', false),
('Chicken Kottu', 'Kottu - Single Portion', 750, 'Single', 'active', 'available', false),
('Pork Kottu', 'Kottu - Single Portion', 950, 'Single', 'active', 'available', false),
('Beef Kottu', 'Kottu - Single Portion', 900, 'Single', 'active', 'available', false),
('Seafood Kottu', 'Kottu - Single Portion', 1000, 'Single', 'active', 'available', false),
('Mixed Kottu', 'Kottu - Single Portion', 1100, 'Single', 'active', 'available', false),
('Vegetable Kottu Large', 'Kottu - Double Portion', 850, 'Double', 'active', 'available', false),
('Egg Kottu Large', 'Kottu - Double Portion', 900, 'Double', 'active', 'available', false),
('Chicken Kottu Large', 'Kottu - Double Portion', 1350, 'Double', 'active', 'available', false),
('Pork Kottu Large', 'Kottu - Double Portion', 1600, 'Double', 'active', 'available', false),
('Beef Kottu Large', 'Kottu - Double Portion', 1550, 'Double', 'active', 'available', false),
('Seafood Kottu Large', 'Kottu - Double Portion', 1850, 'Double', 'active', 'available', false),
('Mixed Kottu Large', 'Kottu - Double Portion', 1950, 'Double', 'active', 'available', false),
('Devilled Chicken', 'Devilled / Stew / Fried - 250g', 750, '250g', 'active', 'available', false),
('Stew Chicken', 'Devilled / Stew / Fried - 250g', 750, '250g', 'active', 'available', false),
('Fried Chicken', 'Devilled / Stew / Fried - 250g', 750, '250g', 'active', 'available', false),
('Devilled Beef', 'Devilled / Stew / Fried - 250g', 900, '250g', 'active', 'available', false),
('Stew Beef', 'Devilled / Stew / Fried - 250g', 900, '250g', 'active', 'available', false),
('Fried Beef', 'Devilled / Stew / Fried - 250g', 900, '250g', 'active', 'available', false),
('Devilled Pork', 'Devilled / Stew / Fried - 250g', 1000, '250g', 'active', 'available', false),
('Stew Pork', 'Devilled / Stew / Fried - 250g', 1000, '250g', 'active', 'available', false),
('Fried Pork', 'Devilled / Stew / Fried - 250g', 1000, '250g', 'active', 'available', false),
('Devilled Fish', 'Devilled / Stew / Fried - 250g', 800, '250g', 'active', 'available', false),
('Stew Fish', 'Devilled / Stew / Fried - 250g', 800, '250g', 'active', 'available', false),
('Fried Fish', 'Devilled / Stew / Fried - 250g', 800, '250g', 'active', 'available', false),
('Hot Butter Cuttlefish', 'Seafood Specials', 950, '250g', 'active', 'available', false),
('Hot Butter Prawns', 'Seafood Specials', 1200, '250g', 'active', 'available', false)
ON DUPLICATE KEY UPDATE 
price = VALUES(price), 
portion_label = VALUES(portion_label);
