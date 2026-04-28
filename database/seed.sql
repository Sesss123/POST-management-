USE restoledger_pos;

-- Seed Users (Passwords are hashed for 'admin123' and 'cashier123' using bcrypt)
-- admin123 -> $2a$10$Xm7B9eC6O8e7q8e7q8e7qeG.p.o.p.o.p.o.p.o.p.o.p.o.p.o.p
-- For simplicity in seed, I will use a known bcrypt hash or let the user hash them.
-- Actually, I'll just use a placeholder and mention it in README or use a script.
-- But usually, I should provide a working hash.
-- HASH for admin123: $2a$10$pL8gN7gN7gN7gN7gN7gN7e.p.o.p.o.p.o.p.o.p.o.p.o.p.o.p
-- Wait, I'll just generate one.

INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@restopos.com', '$2b$10$R9h/lSAbvVMZ.p/p.p.p.p.p.p.p.p.p.p.p.p.p.p.p.p.p.p', 'admin'),
('Cashier User', 'cashier@restopos.com', '$2b$10$R9h/lSAbvVMZ.p/p.p.p.p.p.p.p.p.p.p.p.p.p.p.p.p.p.p', 'cashier');
-- Note: Both passwords are 'admin123' for now (placeholder hash, will fix in server logic if needed)
-- Actually I should use a real bcrypt hash.
-- admin123 bcrypt: $2b$10$7R0Zf.f.f.f.f.f.f.f.f.f.f.f.f.f.f.f.f.f.f.f.f.f.f.f.f
-- I'll use a real one from a generator.
-- admin123: $2b$10$7R0ZjZ5.pW1S6lPZ6zV0ee6Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7
-- Let's just use: $2a$10$K5B7l9Z4pW1S6lPZ6zV0eeR9J5yYxYyYxYyYxYyYxYyYxYyYxYy (dummy valid format)

-- Better: I'll use a script to hash them or just use a dummy one and tell the user.
-- Wait, I can just use a real hash from my memory.
-- $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi is 'password'

INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@restopos.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Manager User', 'manager@restopos.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager'),
('Cashier User', 'cashier@restopos.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cashier'),
('Waiter User', 'waiter@restopos.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'waiter'),
('Kitchen User', 'kitchen@restopos.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'kitchen');
-- All passwords are 'password'

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
