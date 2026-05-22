-- RestoLedger POS Unified Production Schema
-- Generated on: 2026-05-22T20:59:26.219Z
-- This file contains the complete, up-to-date schema with all migrations applied.

SET FOREIGN_KEY_CHECKS = 0;

-- Create Table: audit_logs
CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) DEFAULT NULL,
  `uuid` char(36) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `entity_type` varchar(100) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `old_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_value`)),
  `new_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_value`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_audit_logs_uuid` (`uuid`),
  KEY `user_id` (`user_id`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_audit_logs_shop` (`shop_id`),
  KEY `idx_audit_logs_shop_id` (`shop_id`),
  KEY `idx_audit_shop_id` (`shop_id`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: backup_logs
CREATE TABLE `backup_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL DEFAULT 1,
  `uuid` varchar(36) NOT NULL,
  `backup_type` enum('database','invoices','manual') NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `local_path` varchar(255) DEFAULT NULL,
  `drive_file_id` varchar(255) DEFAULT NULL,
  `drive_folder_id` varchar(255) DEFAULT NULL,
  `status` enum('success','failed') NOT NULL,
  `error_message` text DEFAULT NULL,
  `file_size_mb` decimal(10,2) DEFAULT NULL,
  `is_encrypted` tinyint(1) DEFAULT 0,
  `encryption_method` varchar(20) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_backup_logs_shop_id` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: broadcast_announcements
CREATE TABLE `broadcast_announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) DEFAULT NULL,
  `uuid` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','warning','critical','promotion') DEFAULT 'info',
  `target_shop_id` int(11) DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `target_shop_id` (`target_shop_id`),
  KEY `expires_at` (`expires_at`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `fk_announcements_shop` FOREIGN KEY (`target_shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Table: broadcasts
CREATE TABLE `broadcasts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) DEFAULT NULL,
  `uuid` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','warning','critical','update') DEFAULT 'info',
  `target_role` enum('all','admin','cashier','kitchen') DEFAULT 'all',
  `status` enum('draft','active','expired','archived') DEFAULT 'active',
  `starts_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `created_by` (`created_by`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `broadcasts_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Table: cash_movements
CREATE TABLE `cash_movements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) DEFAULT NULL,
  `uuid` char(36) DEFAULT NULL,
  `shift_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `type` enum('cash_in','cash_out') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_cash_movements_uuid` (`uuid`),
  KEY `shift_id` (`shift_id`),
  KEY `user_id` (`user_id`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `cash_movements_ibfk_1` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cash_movements_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: combo_items
CREATE TABLE `combo_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) DEFAULT NULL,
  `uuid` char(36) DEFAULT NULL,
  `combo_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `qty` int(11) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `combo_id` (`combo_id`),
  KEY `item_id` (`item_id`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `combo_items_ibfk_1` FOREIGN KEY (`combo_id`) REFERENCES `combo_meals` (`id`) ON DELETE CASCADE,
  CONSTRAINT `combo_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: combo_meals
CREATE TABLE `combo_meals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) DEFAULT NULL,
  `uuid` char(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `shop_id` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: customer_ledger
CREATE TABLE `customer_ledger` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `customer_id` int(11) NOT NULL,
  `invoice_id` int(11) DEFAULT NULL,
  `payment_id` int(11) DEFAULT NULL,
  `type` enum('debit','credit','payment','adjustment') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `balance_after` decimal(15,2) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_customer_ledger_uuid` (`uuid`),
  KEY `invoice_id` (`invoice_id`),
  KEY `idx_customer_created` (`customer_id`,`created_at`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_customer_ledger_shop` (`shop_id`),
  CONSTRAINT `customer_ledger_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `customer_ledger_ibfk_2` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: customers
CREATE TABLE `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `nic` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `credit_limit` decimal(15,2) DEFAULT 0.00,
  `current_balance` decimal(15,2) DEFAULT 0.00,
  `status` enum('active','blocked') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`),
  UNIQUE KEY `nic` (`nic`),
  UNIQUE KEY `idx_customers_uuid` (`uuid`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_customers_shop` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: delivery_order_items
CREATE TABLE `delivery_order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL DEFAULT 1,
  `uuid` char(36) NOT NULL,
  `delivery_order_id` int(11) NOT NULL,
  `item_id` int(11) DEFAULT NULL,
  `external_item_name` varchar(150) DEFAULT NULL,
  `item_name` varchar(150) NOT NULL,
  `qty` decimal(12,2) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `total` decimal(12,2) NOT NULL,
  `note` text DEFAULT NULL,
  `matched_status` enum('matched','unmatched','manual') DEFAULT 'manual',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `idx_delivery_order` (`delivery_order_id`),
  KEY `idx_item` (`item_id`),
  KEY `idx_delivery_order_items_shop_id` (`shop_id`),
  CONSTRAINT `delivery_order_items_ibfk_1` FOREIGN KEY (`delivery_order_id`) REFERENCES `delivery_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: delivery_orders
CREATE TABLE `delivery_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `source` enum('manual_delivery','ubereats','pickme','phone_order','whatsapp_order') DEFAULT 'manual_delivery',
  `external_order_id` varchar(150) DEFAULT NULL,
  `customer_name` varchar(150) DEFAULT NULL,
  `customer_phone` varchar(30) DEFAULT NULL,
  `delivery_address` text DEFAULT NULL,
  `delivery_fee` decimal(12,2) DEFAULT 0.00,
  `platform_fee` decimal(12,2) DEFAULT 0.00,
  `subtotal` decimal(12,2) DEFAULT 0.00,
  `grand_total` decimal(12,2) DEFAULT 0.00,
  `payment_method` enum('cash','card','qr','platform_paid','credit') DEFAULT 'cash',
  `payment_status` enum('pending','paid','unpaid','failed') DEFAULT 'pending',
  `order_status` enum('pending','accepted','preparing','ready','out_for_delivery','delivered','rejected','cancelled') DEFAULT 'pending',
  `note` text DEFAULT NULL,
  `raw_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`raw_payload`)),
  `accepted_by` int(11) DEFAULT NULL,
  `accepted_at` datetime DEFAULT NULL,
  `rejected_by` int(11) DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `reject_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `idx_shop_status` (`shop_id`,`order_status`),
  KEY `idx_shop_source` (`shop_id`,`source`),
  KEY `idx_external_id` (`external_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: expenses
CREATE TABLE `expenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `expense_no` varchar(50) NOT NULL,
  `category` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(20) DEFAULT 'cash',
  `paid_from_cash_drawer` tinyint(1) DEFAULT 0,
  `note` text DEFAULT NULL,
  `expense_date` date NOT NULL,
  `status` varchar(20) DEFAULT 'active',
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `expense_no_shop` (`expense_no`,`shop_id`),
  KEY `shop_id` (`shop_id`),
  KEY `expense_date` (`expense_date`),
  CONSTRAINT `fk_expenses_shop` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Table: held_bill_item_modifiers
CREATE TABLE `held_bill_item_modifiers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) DEFAULT NULL,
  `uuid` char(36) DEFAULT NULL,
  `held_bill_item_id` int(11) NOT NULL,
  `modifier_id` int(11) NOT NULL,
  `modifier_name` varchar(150) NOT NULL,
  `modifier_type` varchar(50) NOT NULL,
  `price_delta` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_held_bill_item_modifiers_uuid` (`uuid`),
  KEY `shop_id` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: held_bill_items
CREATE TABLE `held_bill_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `held_bill_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `item_type` enum('item','combo') DEFAULT 'item',
  `combo_id` int(11) DEFAULT NULL,
  `item_name` varchar(255) NOT NULL,
  `portion_type` varchar(50) DEFAULT NULL,
  `qty` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total` decimal(15,2) NOT NULL,
  `note` text DEFAULT NULL,
  `special_note` text DEFAULT NULL,
  `modifier_total` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_held_bill_items_uuid` (`uuid`),
  KEY `held_bill_id` (`held_bill_id`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_held_bill_items_shop` (`shop_id`),
  CONSTRAINT `held_bill_items_ibfk_1` FOREIGN KEY (`held_bill_id`) REFERENCES `held_bills` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: held_bills
CREATE TABLE `held_bills` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `hold_no` varchar(50) DEFAULT NULL,
  `reference_name` varchar(255) DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `customer_phone` varchar(20) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `discount` decimal(15,2) DEFAULT 0.00,
  `grand_total` decimal(15,2) NOT NULL,
  `status` enum('held','resumed','cancelled','completed') DEFAULT 'held',
  `invoice_id` int(11) DEFAULT NULL,
  `cancel_reason` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `resumed_by` int(11) DEFAULT NULL,
  `completed_by` int(11) DEFAULT NULL,
  `cancelled_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `resumed_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hold_no` (`hold_no`),
  UNIQUE KEY `idx_held_bills_uuid` (`uuid`),
  KEY `created_by` (`created_by`),
  KEY `fk_held_bills_resumed_by` (`resumed_by`),
  KEY `fk_held_bills_completed_by` (`completed_by`),
  KEY `fk_held_bills_cancelled_by` (`cancelled_by`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_held_bills_shop` (`shop_id`),
  CONSTRAINT `fk_held_bills_cancelled_by` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_held_bills_completed_by` FOREIGN KEY (`completed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_held_bills_resumed_by` FOREIGN KEY (`resumed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `held_bills_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: idempotency_keys
CREATE TABLE `idempotency_keys` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idempotency_key` varchar(100) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `request_path` varchar(255) NOT NULL,
  `response_body` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`response_body`)),
  `status_code` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idempotency_key` (`idempotency_key`),
  KEY `idx_key_shop` (`idempotency_key`,`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: invoice_item_modifiers
CREATE TABLE `invoice_item_modifiers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) DEFAULT NULL,
  `uuid` char(36) DEFAULT NULL,
  `invoice_item_id` int(11) NOT NULL,
  `modifier_id` int(11) NOT NULL,
  `modifier_name` varchar(150) NOT NULL,
  `modifier_type` varchar(50) NOT NULL,
  `price_delta` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_invoice_item_modifiers_uuid` (`uuid`),
  KEY `shop_id` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: invoice_items
CREATE TABLE `invoice_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `invoice_id` int(11) NOT NULL,
  `item_id` int(11) DEFAULT NULL,
  `combo_id` int(11) DEFAULT NULL,
  `item_name` varchar(255) NOT NULL,
  `qty` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total` decimal(15,2) NOT NULL,
  `item_type` enum('item','combo') DEFAULT 'item',
  `special_note` text DEFAULT NULL,
  `modifier_total` decimal(10,2) DEFAULT 0.00,
  `age_confirmed` tinyint(1) DEFAULT 0,
  `no_receipt_item` tinyint(1) DEFAULT 0,
  `age_restricted` tinyint(1) DEFAULT 0,
  `send_to_kitchen` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_invoice_items_uuid` (`uuid`),
  KEY `invoice_id` (`invoice_id`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_invoice_items_shop` (`shop_id`),
  CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: invoice_payments
CREATE TABLE `invoice_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) DEFAULT NULL,
  `uuid` char(36) DEFAULT NULL,
  `invoice_id` int(11) NOT NULL,
  `payment_method` enum('cash','card','bank','qr','credit') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `invoice_id` (`invoice_id`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `invoice_payments_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: invoices
CREATE TABLE `invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `invoice_no` varchar(50) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `table_id` int(11) DEFAULT NULL,
  `session_id` int(11) DEFAULT NULL,
  `invoice_type` enum('cash_sale','table_sale','credit_sale','quick_sale') NOT NULL,
  `order_type` enum('dine_in','takeaway','delivery') DEFAULT 'takeaway',
  `waiter_id` int(11) DEFAULT NULL,
  `payment_status` enum('paid','unpaid','partially_paid','cancelled','pending','failed','expired') NOT NULL DEFAULT 'unpaid',
  `payment_method` enum('cash','card','credit','split','mixed','qr','genie','bank_transfer') DEFAULT 'cash',
  `subtotal` decimal(15,2) NOT NULL,
  `discount_type` enum('percentage','fixed') DEFAULT 'fixed',
  `discount_value` decimal(15,2) DEFAULT 0.00,
  `discount` decimal(15,2) DEFAULT 0.00,
  `promotion_id` int(11) DEFAULT NULL,
  `promotion_discount_amount` decimal(15,2) DEFAULT 0.00,
  `loyalty_points_redeemed` decimal(12,2) DEFAULT 0.00,
  `loyalty_discount_amount` decimal(12,2) DEFAULT 0.00,
  `tax_rate` decimal(5,2) DEFAULT 0.00,
  `tax_amount` decimal(15,2) DEFAULT 0.00,
  `service_charge_rate` decimal(5,2) DEFAULT 0.00,
  `service_charge_amount` decimal(15,2) DEFAULT 0.00,
  `grand_total` decimal(15,2) NOT NULL,
  `paid_amount` decimal(15,2) DEFAULT 0.00,
  `cash_received` decimal(15,2) DEFAULT 0.00,
  `change_amount` decimal(15,2) DEFAULT 0.00,
  `balance_amount` decimal(15,2) DEFAULT 0.00,
  `cancel_reason` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `no_receipt` tinyint(1) DEFAULT 0,
  `receipt_printed` tinyint(1) DEFAULT 0,
  `sale_channel` enum('normal','quick_no_receipt','held_bill','credit_account') DEFAULT 'normal',
  `sale_type` enum('quick','restaurant') DEFAULT 'restaurant',
  `gateway_provider` varchar(50) DEFAULT NULL,
  `gateway_order_id` varchar(100) DEFAULT NULL,
  `gateway_transaction_id` varchar(100) DEFAULT NULL,
  `gateway_reference` varchar(150) DEFAULT NULL,
  `qr_payment_status` varchar(50) DEFAULT NULL,
  `currency_code` varchar(10) DEFAULT 'LKR',
  `currency_symbol` varchar(10) DEFAULT 'Rs.',
  `tax_name` varchar(20) DEFAULT 'Tax',
  `tax_inclusive` tinyint(1) DEFAULT 0,
  `receipt_restaurant_name` varchar(100) DEFAULT NULL,
  `receipt_restaurant_phone` varchar(20) DEFAULT NULL,
  `receipt_restaurant_address` text DEFAULT NULL,
  `receipt_footer_message` text DEFAULT NULL,
  `receipt_logo_url` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_no` (`invoice_no`),
  UNIQUE KEY `idx_invoices_uuid` (`uuid`),
  KEY `table_id` (`table_id`),
  KEY `session_id` (`session_id`),
  KEY `created_by` (`created_by`),
  KEY `waiter_id` (`waiter_id`),
  KEY `promotion_id` (`promotion_id`),
  KEY `idx_customer_payment_status` (`customer_id`,`payment_status`),
  KEY `idx_customer_balance` (`customer_id`,`balance_amount`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_invoices_shop` (`shop_id`),
  KEY `idx_invoices_shop_created` (`shop_id`,`created_at`),
  KEY `idx_invoices_shop_status` (`shop_id`,`payment_status`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables` (`id`) ON DELETE SET NULL,
  CONSTRAINT `invoices_ibfk_3` FOREIGN KEY (`session_id`) REFERENCES `table_sessions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `invoices_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `invoices_ibfk_5` FOREIGN KEY (`waiter_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `invoices_ibfk_6` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: item_modifiers
CREATE TABLE `item_modifiers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) DEFAULT NULL,
  `uuid` char(36) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `type` enum('add_on','remove','preference','serving') NOT NULL,
  `price_delta` decimal(10,2) DEFAULT 0.00,
  `category` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`,`type`),
  UNIQUE KEY `idx_item_modifiers_uuid` (`uuid`),
  KEY `shop_id` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: items
CREATE TABLE `items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `short_code` varchar(20) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `main_category` varchar(100) DEFAULT NULL,
  `portion_type` enum('single','double','250g','regular') DEFAULT 'regular',
  `price` decimal(10,2) NOT NULL,
  `cost_price` decimal(10,2) DEFAULT 0.00,
  `track_stock` tinyint(1) DEFAULT 0,
  `stock_qty` decimal(10,2) DEFAULT 0.00,
  `low_stock_threshold` decimal(10,2) DEFAULT 0.00,
  `portion_label` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `is_popular` tinyint(1) DEFAULT 0,
  `display_order` int(11) DEFAULT 0,
  `availability_status` enum('available','sold_out','temporarily_unavailable') DEFAULT 'available',
  `combo_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `send_to_kitchen` tinyint(1) DEFAULT 1,
  `item_type` enum('food','beverage','retail','restricted_retail','service') DEFAULT 'food',
  `quick_sale_enabled` tinyint(1) DEFAULT 0,
  `age_restricted` tinyint(1) DEFAULT 0,
  `requires_age_confirmation` tinyint(1) DEFAULT 0,
  `barcode` varchar(100) DEFAULT NULL,
  `unit_type` varchar(50) DEFAULT 'item',
  `no_receipt_default` tinyint(1) DEFAULT 0,
  `show_in_quick_bar` tinyint(1) DEFAULT 0,
  `purchase_unit_type` varchar(50) DEFAULT 'item',
  `units_per_purchase_unit` int(11) DEFAULT 1,
  `is_quick_retail` tinyint(1) DEFAULT 0,
  `is_restaurant_item` tinyint(1) DEFAULT 1,
  `pack_size` int(11) DEFAULT 20,
  `show_on_public_menu` tinyint(1) DEFAULT 1,
  `public_description` text DEFAULT NULL,
  `image_url` text DEFAULT NULL,
  `spice_level` enum('none','mild','medium','spicy','extra_spicy') DEFAULT 'none',
  `is_veg` tinyint(1) DEFAULT 0,
  `is_featured` tinyint(1) DEFAULT 0,
  `public_display_order` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_items_uuid` (`uuid`),
  UNIQUE KEY `unique_shop_name_category` (`shop_id`,`name`,`category`),
  KEY `idx_items_short_code` (`short_code`),
  KEY `idx_items_popular` (`is_popular`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_items_shop_status` (`shop_id`,`status`),
  KEY `idx_items_shop_category` (`shop_id`,`category`),
  KEY `idx_items_shop_availability` (`shop_id`,`availability_status`),
  KEY `idx_items_shop_item_type` (`shop_id`,`item_type`),
  KEY `idx_items_shop_public_menu` (`shop_id`,`show_on_public_menu`),
  KEY `idx_items_shop_quick_retail` (`shop_id`,`is_quick_retail`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: kot_items
CREATE TABLE `kot_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `kot_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `qty` int(11) NOT NULL,
  `note` text DEFAULT NULL,
  `special_note` text DEFAULT NULL,
  `modifier_names` text DEFAULT NULL,
  `status` enum('pending','preparing','ready','served','cancelled') DEFAULT 'pending',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_kot_items_uuid` (`uuid`),
  KEY `kot_id` (`kot_id`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_kot_items_shop` (`shop_id`),
  CONSTRAINT `kot_items_ibfk_1` FOREIGN KEY (`kot_id`) REFERENCES `kot_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: kot_orders
CREATE TABLE `kot_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `kot_no` varchar(50) NOT NULL,
  `table_id` int(11) DEFAULT NULL,
  `session_id` int(11) DEFAULT NULL,
  `order_type` enum('dine_in','takeaway','delivery') NOT NULL,
  `waiter_id` int(11) DEFAULT NULL,
  `status` enum('pending','preparing','ready','served','cancelled') DEFAULT 'pending',
  `note` text DEFAULT NULL,
  `cancel_reason` varchar(255) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `invoice_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kot_no` (`kot_no`),
  UNIQUE KEY `idx_kot_orders_uuid` (`uuid`),
  KEY `table_id` (`table_id`),
  KEY `session_id` (`session_id`),
  KEY `created_by` (`created_by`),
  KEY `fk_kot_waiter` (`waiter_id`),
  KEY `idx_kot_status` (`status`),
  KEY `idx_kot_created` (`created_at`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_kot_orders_shop` (`shop_id`),
  KEY `idx_kot_orders_shop_status` (`shop_id`,`status`),
  CONSTRAINT `fk_kot_waiter` FOREIGN KEY (`waiter_id`) REFERENCES `users` (`id`),
  CONSTRAINT `kot_orders_ibfk_1` FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables` (`id`),
  CONSTRAINT `kot_orders_ibfk_2` FOREIGN KEY (`session_id`) REFERENCES `table_sessions` (`id`),
  CONSTRAINT `kot_orders_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: menu_templates
CREATE TABLE `menu_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) DEFAULT NULL,
  `uuid` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `main_category` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT 0.00,
  `item_type` enum('food','beverage','retail','service') DEFAULT 'food',
  `send_to_kitchen` tinyint(1) DEFAULT 1,
  `show_on_public_menu` tinyint(1) DEFAULT 1,
  `public_description` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `shop_id` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: offline_conflict_logs
CREATE TABLE `offline_conflict_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `draft_id` varchar(150) DEFAULT NULL,
  `idempotency_key` varchar(150) DEFAULT NULL,
  `conflict_type` varchar(100) NOT NULL,
  `conflict_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`conflict_details`)),
  `resolution_action` varchar(100) DEFAULT NULL,
  `resolved_by` int(11) DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Table: offline_sync_records
CREATE TABLE `offline_sync_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `idempotency_key` varchar(150) NOT NULL,
  `draft_type` varchar(50) NOT NULL,
  `request_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`request_payload`)),
  `response_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`response_payload`)),
  `status` enum('processed','failed') DEFAULT 'processed',
  `conflict_type` varchar(100) DEFAULT NULL,
  `conflict_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`conflict_details`)),
  `resolved_by` int(11) DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `resolution_action` varchar(100) DEFAULT NULL,
  `retry_count` int(11) DEFAULT 0,
  `invoice_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `idempotency_key` (`idempotency_key`),
  KEY `idx_shop_id` (`shop_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_idempotency_key` (`idempotency_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: order_item_modifiers
CREATE TABLE `order_item_modifiers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) DEFAULT NULL,
  `uuid` char(36) DEFAULT NULL,
  `order_item_id` int(11) NOT NULL,
  `modifier_id` int(11) NOT NULL,
  `modifier_name` varchar(150) NOT NULL,
  `modifier_type` varchar(50) NOT NULL,
  `price_delta` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_order_item_modifiers_uuid` (`uuid`),
  KEY `shop_id` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: order_items
CREATE TABLE `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `session_id` int(11) NOT NULL,
  `item_id` int(11) DEFAULT NULL,
  `combo_id` int(11) DEFAULT NULL,
  `item_name` varchar(255) NOT NULL,
  `qty` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total` decimal(15,2) NOT NULL,
  `kot_sent` tinyint(1) DEFAULT 0,
  `note` text DEFAULT NULL,
  `status` enum('active','voided','served','cancelled','billed') DEFAULT 'active',
  `void_reason` text DEFAULT NULL,
  `waiter_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `voided_by` int(11) DEFAULT NULL,
  `voided_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `special_note` text DEFAULT NULL,
  `modifier_total` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_order_items_uuid` (`uuid`),
  KEY `session_id` (`session_id`),
  KEY `item_id` (`item_id`),
  KEY `created_by` (`created_by`),
  KEY `waiter_id` (`waiter_id`),
  KEY `fk_order_item_voided_by` (`voided_by`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_order_items_shop` (`shop_id`),
  CONSTRAINT `fk_order_item_voided_by` FOREIGN KEY (`voided_by`) REFERENCES `users` (`id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `table_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`),
  CONSTRAINT `order_items_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `order_items_ibfk_4` FOREIGN KEY (`waiter_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: payment_allocations
CREATE TABLE `payment_allocations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) DEFAULT NULL,
  `uuid` char(36) DEFAULT NULL,
  `payment_id` int(11) NOT NULL,
  `invoice_id` int(11) NOT NULL,
  `allocated_amount` decimal(15,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_payment_allocations_uuid` (`uuid`),
  KEY `idx_payment_id` (`payment_id`),
  KEY `idx_invoice_id` (`invoice_id`),
  KEY `shop_id` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: payment_transactions
CREATE TABLE `payment_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) NOT NULL,
  `invoice_id` int(11) NOT NULL,
  `held_bill_id` int(11) DEFAULT NULL,
  `session_id` int(11) DEFAULT NULL,
  `provider` varchar(50) NOT NULL,
  `method` varchar(50) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'LKR',
  `status` enum('pending','paid','failed','expired','cancelled') NOT NULL DEFAULT 'pending',
  `gateway_order_id` varchar(100) DEFAULT NULL,
  `gateway_transaction_id` varchar(100) DEFAULT NULL,
  `gateway_reference` varchar(150) DEFAULT NULL,
  `qr_payload` text DEFAULT NULL,
  `qr_image_url` text DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `request_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`request_payload`)),
  `response_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`response_payload`)),
  `callback_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`callback_payload`)),
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `paid_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `created_by` (`created_by`),
  KEY `invoice_id` (`invoice_id`),
  KEY `uuid_2` (`uuid`),
  KEY `provider` (`provider`),
  KEY `status` (`status`),
  KEY `gateway_order_id` (`gateway_order_id`),
  KEY `gateway_transaction_id` (`gateway_transaction_id`),
  KEY `idx_pt_held_bill` (`held_bill_id`),
  KEY `idx_pt_session` (`session_id`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_payment_tx_shop` (`shop_id`),
  CONSTRAINT `payment_transactions_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payment_transactions_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: payments
CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `customer_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method` enum('cash','card','bank','qr') NOT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_payments_uuid` (`uuid`),
  KEY `created_by` (`created_by`),
  KEY `idx_customer_payment_created` (`customer_id`,`created_at`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_payments_shop` (`shop_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: permissions
CREATE TABLE `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) DEFAULT NULL,
  `perm_key` varchar(100) NOT NULL,
  `name` varchar(150) NOT NULL,
  `category` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `perm_key` (`perm_key`),
  KEY `shop_id` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: platform_settings
CREATE TABLE `platform_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) DEFAULT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `shop_id` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: promotion_usage
CREATE TABLE `promotion_usage` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL DEFAULT 1,
  `promotion_id` int(11) NOT NULL,
  `invoice_id` int(11) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `used_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `promotion_id` (`promotion_id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `idx_promotion_usage_shop_id` (`shop_id`),
  CONSTRAINT `promotion_usage_ibfk_1` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`),
  CONSTRAINT `promotion_usage_ibfk_2` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: promotions
CREATE TABLE `promotions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('percentage_discount','fixed_discount','buy_one_get_one') NOT NULL,
  `value` decimal(10,2) DEFAULT 0.00,
  `min_order_amount` decimal(10,2) DEFAULT 0.00,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `applicable_order_types` varchar(255) DEFAULT 'dine_in,takeaway,delivery',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `applicable_order_type` enum('all','dine_in','takeaway','delivery') DEFAULT 'all',
  PRIMARY KEY (`id`),
  KEY `shop_id` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: purchase_items
CREATE TABLE `purchase_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `purchase_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `item_name` varchar(150) DEFAULT NULL,
  `qty` decimal(10,2) NOT NULL,
  `unit_cost` decimal(10,2) NOT NULL,
  `total` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_purchase_items_uuid` (`uuid`),
  KEY `purchase_id` (`purchase_id`),
  KEY `item_id` (`item_id`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_purchase_items_shop` (`shop_id`),
  CONSTRAINT `purchase_items_ibfk_1` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: purchases
CREATE TABLE `purchases` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `purchase_no` varchar(50) NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `paid_amount` decimal(15,2) DEFAULT 0.00,
  `payment_status` enum('paid','partial','unpaid') DEFAULT 'unpaid',
  `payment_method` varchar(50) DEFAULT 'cash',
  `received_by` int(11) DEFAULT NULL,
  `received_date` date DEFAULT NULL,
  `status` enum('received','cancelled') DEFAULT 'received',
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `purchase_date` date DEFAULT NULL,
  `subtotal` decimal(12,2) DEFAULT 0.00,
  `discount` decimal(12,2) DEFAULT 0.00,
  `grand_total` decimal(12,2) DEFAULT 0.00,
  `balance_amount` decimal(12,2) DEFAULT 0.00,
  `created_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `purchase_no` (`purchase_no`),
  UNIQUE KEY `idx_purchases_uuid` (`uuid`),
  KEY `supplier_id` (`supplier_id`),
  KEY `received_by` (`received_by`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_purchases_shop` (`shop_id`),
  CONSTRAINT `purchases_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `purchases_ibfk_2` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: reservations
CREATE TABLE `reservations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) DEFAULT NULL,
  `shop_id` int(11) DEFAULT NULL,
  `reservation_no` varchar(20) DEFAULT NULL,
  `customer_name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `guests_count` int(11) DEFAULT 1,
  `reservation_date` date NOT NULL,
  `reservation_time` time NOT NULL,
  `table_id` int(11) DEFAULT NULL,
  `status` enum('pending','confirmed','cancelled','seated','no_show') DEFAULT 'pending',
  `note` text DEFAULT NULL,
  `seated_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancel_reason` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `table_id` (`table_id`),
  KEY `created_by` (`created_by`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables` (`id`),
  CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: restaurant_tables
CREATE TABLE `restaurant_tables` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `table_no` varchar(50) NOT NULL,
  `capacity` int(11) DEFAULT 4,
  `status` enum('available','occupied','reserved','cleaning','billing') DEFAULT 'available',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `public_menu_token` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `table_no` (`table_no`),
  UNIQUE KEY `idx_restaurant_tables_uuid` (`uuid`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_tables_shop` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: retail_stock_receipts
CREATE TABLE `retail_stock_receipts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `item_id` int(11) NOT NULL,
  `purchase_unit_type` varchar(50) NOT NULL,
  `purchase_unit_qty` decimal(12,2) NOT NULL,
  `units_per_purchase_unit` int(11) NOT NULL,
  `total_units_added` decimal(12,2) NOT NULL,
  `cost_per_purchase_unit` decimal(12,2) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_retail_stock_receipts_uuid` (`uuid`),
  KEY `item_id` (`item_id`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_retail_receipts_shop` (`shop_id`),
  CONSTRAINT `retail_stock_receipts_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: role_permissions
CREATE TABLE `role_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `role` varchar(50) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `permission_id` (`permission_id`),
  KEY `idx_shop_role` (`shop_id`,`role`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: settings
CREATE TABLE `settings` (
  `setting_key` varchar(255) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `setting_type` enum('string','number','boolean','select','json') DEFAULT 'string',
  `group_name` varchar(100) DEFAULT 'general',
  `label` varchar(150) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `options` text DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`shop_id`,`setting_key`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `idx_settings_uuid` (`uuid`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_settings_shop` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: shifts
CREATE TABLE `shifts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) DEFAULT NULL,
  `uuid` char(36) DEFAULT NULL,
  `shift_no` varchar(50) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `start_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `end_time` timestamp NULL DEFAULT NULL,
  `opening_cash` decimal(15,2) NOT NULL,
  `actual_cash` decimal(15,2) DEFAULT 0.00,
  `expected_cash` decimal(15,2) DEFAULT 0.00,
  `difference` decimal(15,2) DEFAULT 0.00,
  `status` enum('open','closed') DEFAULT 'open',
  `note` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `shift_no` (`shift_no`),
  UNIQUE KEY `idx_shifts_uuid` (`uuid`),
  KEY `user_id` (`user_id`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `shifts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: shops
CREATE TABLE `shops` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `identifier` varchar(100) DEFAULT NULL,
  `subdomain` varchar(100) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `suspension_reason` text DEFAULT NULL,
  `subscription_status` enum('trial','active','grace','restricted','locked','suspended','cancelled') DEFAULT 'trial',
  `subscription_plan` varchar(50) NOT NULL DEFAULT 'standard',
  `has_delivery_orders` tinyint(1) DEFAULT 0,
  `has_marketing_center` tinyint(1) DEFAULT 0,
  `has_quick_retail` tinyint(1) DEFAULT 0,
  `trial_ends_at` date DEFAULT NULL,
  `subscription_end_date` date DEFAULT NULL,
  `grace_until` date DEFAULT NULL,
  `locked_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `monthly_fee` decimal(12,2) DEFAULT 0.00,
  `trial_until` date DEFAULT NULL,
  `last_payment_date` date DEFAULT NULL,
  `last_payment_amount` decimal(10,2) DEFAULT NULL,
  `next_billing_date` date DEFAULT NULL,
  `plan` varchar(50) DEFAULT 'standard',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `module_permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`module_permissions`)),
  `temp_password` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `subdomain` (`subdomain`),
  UNIQUE KEY `identifier` (`identifier`),
  KEY `idx_shops_subscription_status` (`subscription_status`),
  KEY `idx_shops_subscription_end` (`subscription_end_date`),
  KEY `idx_shops_grace_until` (`grace_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: sms_campaigns
CREATE TABLE `sms_campaigns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `target_group` enum('all','active_customers','debtors','loyalty_members') DEFAULT 'all',
  `status` enum('draft','scheduled','sending','completed','failed') DEFAULT 'draft',
  `total_recipients` int(11) DEFAULT 0,
  `successful_sends` int(11) DEFAULT 0,
  `failed_sends` int(11) DEFAULT 0,
  `scheduled_at` datetime DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `idx_shop_status` (`shop_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: sms_logs
CREATE TABLE `sms_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `recipient_phone` varchar(20) NOT NULL,
  `message` text NOT NULL,
  `type` enum('campaign','transactional','reminder') DEFAULT 'transactional',
  `status` enum('pending','sent','delivered','failed') DEFAULT 'pending',
  `error_message` text DEFAULT NULL,
  `provider_ref` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_shop_phone` (`shop_id`,`recipient_phone`),
  KEY `campaign_id` (`campaign_id`),
  CONSTRAINT `sms_logs_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `sms_campaigns` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: stock_movements
CREATE TABLE `stock_movements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `item_id` int(11) NOT NULL,
  `type` enum('in','out','adjustment','sale','purchase','stock_in','stock_out','void_reverse','cancel_reverse') NOT NULL,
  `qty` decimal(12,2) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `reference_type` varchar(100) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `balance_after` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_stock_movements_uuid` (`uuid`),
  KEY `idx_item_id` (`item_id`),
  KEY `idx_type` (`type`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_reference` (`reference_type`,`reference_id`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_stock_movements_shop` (`shop_id`),
  CONSTRAINT `fk_stock_movements_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: subscription_logs
CREATE TABLE `subscription_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) DEFAULT NULL,
  `shop_id` int(11) NOT NULL,
  `action` enum('subscription_created','payment_received','subscription_extended','status_changed','shop_locked','shop_unlocked','trial_started','auto_advanced') NOT NULL,
  `old_status` varchar(20) DEFAULT NULL,
  `new_status` varchar(20) DEFAULT NULL,
  `old_end_date` date DEFAULT NULL,
  `new_end_date` date DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `months_added` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `performed_by` int(11) DEFAULT NULL COMMENT 'super_admin user id — NULL means auto/system',
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reference_no` varchar(100) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `old_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_value`)),
  `new_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_value`)),
  `recorded_by` int(11) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_shop_id` (`shop_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: subscription_payments
CREATE TABLE `subscription_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT 'cash',
  `reference_no` varchar(150) DEFAULT NULL,
  `period_start` date DEFAULT NULL,
  `period_end` date DEFAULT NULL,
  `recorded_by` int(11) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `idx_sub_pay_shop` (`shop_id`),
  KEY `idx_sub_pay_created` (`created_at`),
  CONSTRAINT `subscription_payments_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Table: subscription_plans
CREATE TABLE `subscription_plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `plan_key` varchar(50) NOT NULL,
  `monthly_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `setup_fee` decimal(10,2) DEFAULT 0.00,
  `yearly_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `billing_interval` enum('monthly','yearly') DEFAULT 'monthly',
  `features` text DEFAULT NULL,
  `module_permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`module_permissions`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `plan_key` (`plan_key`),
  KEY `shop_id` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: supplier_ledger
CREATE TABLE `supplier_ledger` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `supplier_id` int(11) NOT NULL,
  `type` enum('purchase','payment','return','adjustment') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `balance_after` decimal(15,2) NOT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_supplier_ledger_uuid` (`uuid`),
  KEY `supplier_id` (`supplier_id`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_supplier_ledger_shop` (`shop_id`),
  CONSTRAINT `supplier_ledger_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: supplier_payment_allocations
CREATE TABLE `supplier_payment_allocations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) DEFAULT NULL,
  `uuid` char(36) DEFAULT NULL,
  `supplier_payment_id` int(11) NOT NULL,
  `purchase_id` int(11) NOT NULL,
  `allocated_amount` decimal(12,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_supplier_payment_allocations_uuid` (`uuid`),
  KEY `supplier_payment_id` (`supplier_payment_id`),
  KEY `purchase_id` (`purchase_id`),
  KEY `shop_id` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: supplier_payments
CREATE TABLE `supplier_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `supplier_id` int(11) NOT NULL,
  `purchase_id` int(11) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` enum('cash','card','bank_transfer','cheque','qr') DEFAULT 'cash',
  `note` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_supplier_payments_uuid` (`uuid`),
  KEY `supplier_id` (`supplier_id`,`created_at`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_supplier_payments_shop` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: suppliers
CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `bank_account` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `current_balance` decimal(15,2) DEFAULT 0.00,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `opening_balance` decimal(12,2) DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`),
  UNIQUE KEY `idx_suppliers_uuid` (`uuid`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_suppliers_shop` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: support_replies
CREATE TABLE `support_replies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `is_internal` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `ticket_id` (`ticket_id`),
  KEY `user_id` (`user_id`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `support_replies_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`),
  CONSTRAINT `support_replies_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Table: support_tickets
CREATE TABLE `support_tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `category` enum('technical','billing','feature_request','bug','other') DEFAULT 'technical',
  `status` enum('open','in_progress','resolved','closed') DEFAULT 'open',
  `admin_response` text DEFAULT NULL,
  `responded_at` timestamp NULL DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `last_reply_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `shop_id` (`shop_id`),
  KEY `user_id` (`user_id`),
  KEY `assigned_to` (`assigned_to`),
  CONSTRAINT `support_tickets_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`),
  CONSTRAINT `support_tickets_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `support_tickets_ibfk_3` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Table: table_sessions
CREATE TABLE `table_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `session_no` varchar(50) NOT NULL,
  `table_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `order_type` enum('dine_in','takeaway','delivery') DEFAULT 'dine_in',
  `waiter_id` int(11) DEFAULT NULL,
  `status` enum('open','billed','paid','credit','cancelled') DEFAULT 'open',
  `opened_by` int(11) DEFAULT NULL,
  `closed_by` int(11) DEFAULT NULL,
  `opened_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `closed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_no` (`session_no`),
  UNIQUE KEY `idx_table_sessions_uuid` (`uuid`),
  KEY `table_id` (`table_id`),
  KEY `customer_id` (`customer_id`),
  KEY `opened_by` (`opened_by`),
  KEY `closed_by` (`closed_by`),
  KEY `waiter_id` (`waiter_id`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_table_sessions_shop` (`shop_id`),
  CONSTRAINT `table_sessions_ibfk_1` FOREIGN KEY (`table_id`) REFERENCES `restaurant_tables` (`id`),
  CONSTRAINT `table_sessions_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `table_sessions_ibfk_3` FOREIGN KEY (`opened_by`) REFERENCES `users` (`id`),
  CONSTRAINT `table_sessions_ibfk_4` FOREIGN KEY (`closed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `table_sessions_ibfk_5` FOREIGN KEY (`waiter_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: user_permissions
CREATE TABLE `user_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `value` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `permission_id` (`permission_id`),
  KEY `user_id` (`user_id`),
  KEY `idx_shop_user` (`shop_id`,`user_id`),
  CONSTRAINT `user_permissions_ibfk_1` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_permissions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create Table: users
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `uuid` char(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('super_admin','admin','manager','cashier','waiter','kitchen') DEFAULT 'cashier',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login_at` datetime DEFAULT NULL,
  `last_login_ip` varchar(45) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `token_version` int(11) DEFAULT 0,
  `is_2fa_enabled` tinyint(1) DEFAULT 0,
  `otp_code` varchar(6) DEFAULT NULL,
  `otp_expires_at` datetime DEFAULT NULL,
  `failed_login_attempts` int(11) DEFAULT 0,
  `locked_until` datetime DEFAULT NULL,
  `temp_password` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `idx_users_uuid` (`uuid`),
  KEY `shop_id` (`shop_id`),
  KEY `idx_users_shop` (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;
