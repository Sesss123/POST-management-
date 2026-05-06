-- Seed Users (Passwords are 'password')
INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@restopos.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Manager User', 'manager@restopos.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager'),
('Cashier User', 'cashier@restopos.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cashier'),
('Waiter User', 'waiter@restopos.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'waiter'),
('Kitchen User', 'kitchen@restopos.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'kitchen');

-- Seed Items
INSERT INTO items (name, category, price, stock_qty) VALUES 
('Chicken Fried Rice', 'Rice', 950.00, 100),
('Egg Fried Rice', 'Rice', 750.00, 100),
('Chicken Kottu', 'Kottu', 850.00, 100),
('Cheese Kottu', 'Kottu', 1200.00, 100),
('Rice & Curry', 'Meals', 650.00, 100),
('Coke', 'Drinks', 250.00, 100),
('Water Bottle', 'Drinks', 150.00, 100),
('Tea', 'Drinks', 120.00, 100);

-- Seed Tables
INSERT INTO restaurant_tables (table_no, status) VALUES 
('T01', 'available'),
('T02', 'available'),
('T03', 'available'),
('T04', 'available'),
('T05', 'available'),
('T06', 'available'),
('T07', 'available'),
('T08', 'available');

-- Seed Customers
INSERT INTO customers (name, phone, address, nic, credit_limit) VALUES 
('Kamal Perera', '0771234567', 'Colombo', '123456789V', 25000.00),
('Nimal Silva', '0719876543', 'Kandy', '987654321V', 15000.00),
('Saman Kumara', '0755555555', 'Galle', '555555555V', 10000.00);

-- Seed Settings
INSERT INTO settings (setting_key, setting_value) VALUES 
('restaurant_name', 'RestoLedger Premium'),
('restaurant_address', '123, Main Street, Colombo'),
('restaurant_phone', '0112345678'),
('currency_symbol', 'Rs.'),
('service_charge_enabled', 'true'),
('service_charge_rate', '10.00'),
('tax_enabled', 'false'),
('tax_rate', '0.00'),
('stock_tracking_enabled', 'true'),
('shift_enforcement_enabled', 'true'),
('kot_printing_enabled', 'true'),
('discount_approval_limit', '10.00'),
('receipt_footer', 'Thank you for dining with us!');
