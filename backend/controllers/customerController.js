const { db } = require('../config/db');
const { buildIdOrUuidWhere, generateUuid } = require('../utils/identifier');
const { encrypt, decrypt } = require('../utils/cryptoVault');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
// @desc    Get customers with balances (Debtors)
// @route   GET /api/customers/debtors
// @access  Private
exports.getDebtors = async (req, res) => {
    const { search, include_zero, status } = req.query;
    
    try {
        let sql = `
            SELECT *, 
                   (credit_limit - current_balance) as remaining_credit,
                   (SELECT MAX(created_at) FROM customer_ledger WHERE customer_id = customers.id AND type = 'debit') as last_credit_date
            FROM customers 
            WHERE shop_id = ?
        `;
        const params = [req.shopId];

        if (include_zero !== 'true') {
            sql += ' AND current_balance > 0';
        }

        if (status && status !== 'all') {
            sql += ' AND status = ?';
            params.push(status);
        }

        if (search) {
            sql += ' AND (name LIKE ? OR phone LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        sql += ' ORDER BY current_balance DESC';

        const [debtors] = await db.query(sql, params);
        res.json({ success: true, data: debtors });
    } catch (error) {
        console.error('Get Debtors Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getCustomers = async (req, res) => {
    try {
        const [customers] = await db.query('SELECT * FROM customers WHERE shop_id = ? ORDER BY name ASC', [req.shopId]);
        
        // Decrypt NIC if present
        const decryptedCustomers = customers.map(c => ({
            ...c,
            nic: c.nic ? decrypt(c.nic) : null
        }));
        
        res.json({ success: true, data: decryptedCustomers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
exports.createCustomer = async (req, res) => {
    const { name, phone, address, nic, credit_limit, opening_balance = 0, status = 'active', loyalty_enabled = true } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Check for duplicate phone number
        const [phoneCheck] = await connection.query('SELECT id FROM customers WHERE phone = ? AND shop_id = ?', [phone, req.shopId]);
        if (phoneCheck.length > 0) {
            throw new Error('Phone number already exists');
        }

        const initialBalance = parseFloat(opening_balance) || 0;
        const limit = parseFloat(credit_limit) || 0;
        const uuid = generateUuid();

        // 2. Insert customer
        const [result] = await connection.query(
            'INSERT INTO customers (uuid, name, phone, address, nic, credit_limit, current_balance, loyalty_enabled, status, shop_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [uuid, name, phone, address, nic ? encrypt(nic) : null, limit, initialBalance, loyalty_enabled, status, req.shopId]
        );
        const customerId = result.insertId;

        // 3. Create ledger entry for opening balance if > 0
        if (initialBalance > 0) {
            await connection.query(
                `INSERT INTO customer_ledger (customer_id, type, amount, balance_after, description, shop_id)
                 VALUES (?, 'debit', ?, ?, 'Opening balance', ?)`,
                [customerId, initialBalance, initialBalance, req.shopId]
            );
        }

        const { logAction } = require('../utils/logger');
        await logAction(req.user.id, 'customer_created', 'customer', customerId, null, req.body);

        await connection.commit();
        
        const [newCustomer] = await db.query('SELECT * FROM customers WHERE id = ? AND shop_id = ?', [customerId, req.shopId]);
        res.status(201).json({ success: true, data: newCustomer[0] });
    } catch (error) {
        await connection.rollback();
        console.error('Create Customer Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    } finally {
        connection.release();
    }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
exports.updateCustomer = async (req, res) => {
    const { name, phone, address, nic, credit_limit, loyalty_enabled } = req.body;
    try {
        const where = buildIdOrUuidWhere(null, req.params.id);
        const [oldCust] = await db.query(`SELECT * FROM customers WHERE ${where.query} AND shop_id = ?`, [where.value, req.shopId]);
        if (oldCust.length === 0) return res.status(404).json({ success: false, message: 'Customer not found' });
        const customerId = oldCust[0].id;

        await db.query(
            'UPDATE customers SET name = ?, phone = ?, address = ?, nic = ?, credit_limit = ?, loyalty_enabled = ? WHERE id = ? AND shop_id = ?',
            [name, phone, address, nic ? encrypt(nic) : null, parseFloat(credit_limit) || 0, loyalty_enabled !== false, customerId, req.shopId]
        );

        const { logAction } = require('../utils/logger');
        await logAction(req.user.id, 'customer_updated', 'customer', customerId, oldCust[0], req.body);

        res.json({ success: true, message: 'Customer updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get customer ledger
// @route   GET /api/customers/:id/ledger
// @access  Private
// @desc    Get customer ledger, unpaid invoices, and recent payments
// @route   GET /api/customers/:id/ledger
// @access  Private
exports.getCustomerLedger = async (req, res) => {
    const identifier = req.params.id;
    try {
        const where = buildIdOrUuidWhere('c', identifier);
        // 1. Get customer details
        const [customers] = await db.query(`SELECT c.*, (c.credit_limit - c.current_balance) as remaining_credit FROM customers c WHERE ${where.query} AND c.shop_id = ?`, [where.value, req.shopId]);
        if (customers.length === 0) return res.status(404).json({ success: false, message: 'Customer not found' });
        const customer = {
            ...customers[0],
            nic: customers[0].nic ? decrypt(customers[0].nic) : null
        };
        const customerId = customer.id;

        // 2. Get ledger entries
        const [ledger] = await db.query(`
            SELECT cl.*, i.uuid as invoice_uuid 
            FROM customer_ledger cl
            LEFT JOIN invoices i ON cl.invoice_id = i.id
            WHERE cl.customer_id = ? AND cl.shop_id = ?
            ORDER BY cl.created_at DESC
        `, [customerId, req.shopId]);

        // 3. Get unpaid invoices
        const [unpaidInvoices] = await db.query(`
            SELECT id, uuid, invoice_no, invoice_type, grand_total, paid_amount, balance_amount, payment_status, created_at 
            FROM invoices 
            WHERE customer_id = ? AND payment_status != 'paid' AND payment_status != 'cancelled' AND shop_id = ?
            ORDER BY created_at DESC
        `, [customerId, req.shopId]);

        // 4. Get recent payments
        const [payments] = await db.query(`
            SELECT * FROM payments 
            WHERE customer_id = ? AND shop_id = ?
            ORDER BY created_at DESC 
            LIMIT 20
        `, [customerId, req.shopId]);

        // Get allocations for these payments
        if (payments.length > 0) {
            const paymentIds = payments.map(p => p.id);
            const [allocations] = await db.query(`
                SELECT pa.*, i.invoice_no 
                FROM payment_allocations pa 
                JOIN invoices i ON pa.invoice_id = i.id 
                WHERE pa.payment_id IN (${paymentIds.join(',')}) AND pa.shop_id = ?
            `, [req.shopId]);

            // Map allocations back to payments
            payments.forEach(p => {
                p.allocations = allocations.filter(a => a.payment_id === p.id);
            });
        }

        // 5. Summary Stats
        const unpaid_invoice_total = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.balance_amount), 0);
        const [lastPayment] = await db.query('SELECT created_at FROM payments WHERE customer_id = ? AND shop_id = ? ORDER BY created_at DESC LIMIT 1', [customerId, req.shopId]);
        
        res.json({ 
            success: true, 
            data: {
                customer,
                summary: {
                    current_balance: customer.current_balance,
                    unpaid_invoice_total,
                    unpaid_invoice_count: unpaidInvoices.length,
                    last_payment_date: lastPayment.length > 0 ? lastPayment[0].created_at : null
                },
                ledger,
                unpaid_invoices: unpaidInvoices,
                payments
            }
        });
    } catch (error) {
        console.error('Get Customer Ledger Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get full account statement details (Alias for getCustomerLedger with maybe more details)
// @route   GET /api/customers/:id/account
// @access  Private
exports.getAccountDetails = exports.getCustomerLedger;

// @desc    Update customer status
// @route   PATCH /api/customers/:id/status
// @access  Private/Admin
exports.updateCustomerStatus = async (req, res) => {
    const { status } = req.body;
    try {
        const where = buildIdOrUuidWhere(null, req.params.id);
        const [oldCust] = await db.query(`SELECT id, status FROM customers WHERE ${where.query} AND shop_id = ?`, [where.value, req.shopId]);
        if (oldCust.length === 0) return res.status(404).json({ success: false, message: 'Customer not found' });
        const customerId = oldCust[0].id;

        await db.query('UPDATE customers SET status = ? WHERE id = ? AND shop_id = ?', [status, customerId, req.shopId]);
        
        const action = status === 'blocked' ? 'customer_blocked' : 'customer_unblocked';
        const { logAction } = require('../utils/logger');
        await logAction(req.user.id, action, 'customer', customerId, { status: oldCust[0].status }, { status });

        const [updatedCustomer] = await db.query('SELECT * FROM customers WHERE id = ? AND shop_id = ?', [customerId, req.shopId]);
        res.json({ success: true, message: 'Customer status updated', data: updatedCustomer[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
// @desc    Get loyalty history
// @route   GET /api/customers/:id/loyalty
// @access  Private
exports.getLoyaltyHistory = async (req, res) => {
    // Loyalty system decommissioned
    res.json({ success: true, data: [] });
};

// @desc    Adjust loyalty points
// @route   POST /api/customers/:id/loyalty/adjust
// @access  Private/Admin
exports.adjustLoyaltyPoints = async (req, res) => {
    // Loyalty system decommissioned
    res.json({ success: true, message: 'Loyalty system is disabled' });
};
