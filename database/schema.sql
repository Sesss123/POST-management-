-- RestoLedger POS MySQL Schema
CREATE DATABASE IF NOT EXISTS restoledger_pos;
USE restoledger_pos;

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
    stock_qty INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
    status ENUM('open', 'billed', 'paid', 'credit', 'cancelled') DEFAULT 'open',
    opened_by INT,
    closed_by INT NULL,
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (opened_by) REFERENCES users(id),
    FOREIGN KEY (closed_by) REFERENCES users(id)
);

-- 6. Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    item_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    qty INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(15, 2) NOT NULL,
    kot_sent BOOLEAN DEFAULT FALSE,
    note TEXT NULL,
    status ENUM('active', 'voided', 'served', 'cancelled', 'billed') DEFAULT 'active',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES table_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
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

-- 9. Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NULL,
    table_id INT NULL,
    session_id INT NULL,
    invoice_type ENUM('cash_sale', 'table_sale', 'delivery', 'credit_sale') NOT NULL,
    payment_status ENUM('paid', 'unpaid', 'partially_paid', 'cancelled') DEFAULT 'unpaid',
    payment_method ENUM('cash', 'card', 'credit', 'split', 'mixed') DEFAULT 'cash',
    subtotal DECIMAL(15, 2) NOT NULL,
    discount_type ENUM('percentage', 'fixed') DEFAULT 'fixed',
    discount_value DECIMAL(15, 2) DEFAULT 0.00,
    discount DECIMAL(15, 2) DEFAULT 0.00,
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
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 10. Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    item_id INT NULL,
    item_name VARCHAR(255) NOT NULL,
    qty INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(15, 2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
);

-- 11. Invoice Payments
CREATE TABLE IF NOT EXISTS invoice_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    payment_method ENUM('cash', 'card', 'bank', 'qr', 'credit') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    reference_no VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- 12. Payments (Direct customer payments)
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NULL,
    invoice_id INT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 13. Customer Ledger
CREATE TABLE IF NOT EXISTS customer_ledger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    invoice_id INT NULL,
    payment_id INT NULL,
    type ENUM('debit', 'credit', 'payment', 'adjustment') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
);

-- 14. Held Bills
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

-- 15. Shifts
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

-- 16. Cash Movements
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

-- 17. Settings
CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(255) PRIMARY KEY,
    setting_value TEXT
);

-- 18. Audit Logs
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

-- Seed Default Settings
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
