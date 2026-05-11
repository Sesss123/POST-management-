const { db } = require('../config/db');
const { logAction } = require('../utils/logger');
const { encrypt, decrypt } = require('../utils/cryptoVault');
const supplierAccountService = require('../services/supplierAccountService');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private/Admin/Manager
exports.getSuppliers = async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = 'SELECT * FROM suppliers WHERE shop_id = ?';
        let params = [req.shopId];

        if (search) {
            query += ' AND (name LIKE ? OR phone LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY name ASC';
        
        const [suppliers] = await db.query(query, params);
        
        // Decrypt sensitive fields
        const decryptedSuppliers = suppliers.map(s => ({
            ...s,
            bank_account: s.bank_account ? decrypt(s.bank_account) : null
        }));
        
        res.json({ success: true, data: decryptedSuppliers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Private/Admin/Manager
exports.createSupplier = async (req, res) => {
    const { name, phone, address, email, bank_account, contact_person, opening_balance, notes } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const openBalance = parseFloat(opening_balance || 0);
        
        const [result] = await connection.query(
            `INSERT INTO suppliers (name, phone, address, email, bank_account, contact_person, opening_balance, current_balance, notes, created_by, shop_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, phone, address, email, bank_account ? encrypt(bank_account) : null, contact_person, openBalance, openBalance, notes, req.user.id, req.shopId]
        );
        
        const supplierId = result.insertId;

        if (openBalance > 0) {
            await connection.query(
                `INSERT INTO supplier_ledger (supplier_id, type, amount, balance_after, description, shop_id)
                 VALUES (?, 'debit', ?, ?, ?, ?)`,
                [supplierId, openBalance, openBalance, 'Opening balance recorded', req.shopId]
            );
        }

        await logAction(req.user.id, 'supplier_created', 'supplier', supplierId, null, { name, openBalance });
        
        await connection.commit();
        res.status(201).json({ success: true, message: 'Supplier created', data: { id: supplierId } });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    } finally {
        connection.release();
    }
};

// @desc    Get supplier account details (Summary, Ledger, History)
// @route   GET /api/suppliers/:id/account
// @access  Private/Admin/Manager
exports.getSupplierAccount = async (req, res) => {
    try {
        const supplierId = req.params.id;
        
        const [suppliers] = await db.query('SELECT * FROM suppliers WHERE id = ? AND shop_id = ?', [supplierId, req.shopId]);
        if (suppliers.length === 0) return res.status(404).json({ success: false, message: 'Supplier not found' });
        const supplier = {
            ...suppliers[0],
            bank_account: suppliers[0].bank_account ? decrypt(suppliers[0].bank_account) : null
        };

        // Get Summary
        const [unpaidSummary] = await db.query(
            `SELECT COUNT(*) as count, SUM(balance_amount) as total 
             FROM purchases 
             WHERE supplier_id = ? AND payment_status IN ('unpaid', 'partial') AND shop_id = ?`,
            [supplierId, req.shopId]
        );

        const [lastPayment] = await db.query(
            'SELECT created_at FROM supplier_payments WHERE supplier_id = ? AND shop_id = ? ORDER BY created_at DESC LIMIT 1',
            [supplierId, req.shopId]
        );

        // Get History (Limit for performance)
        const [purchases] = await db.query('SELECT * FROM purchases WHERE supplier_id = ? AND shop_id = ? ORDER BY purchase_date DESC LIMIT 50', [supplierId, req.shopId]);
        const [ledger] = await db.query('SELECT * FROM supplier_ledger WHERE supplier_id = ? AND shop_id = ? ORDER BY created_at DESC LIMIT 100', [supplierId, req.shopId]);
        const [payments] = await db.query('SELECT * FROM supplier_payments WHERE supplier_id = ? AND shop_id = ? ORDER BY created_at DESC LIMIT 50', [supplierId, req.shopId]);

        res.json({
            success: true,
            data: {
                supplier,
                summary: {
                    current_balance: supplier.current_balance,
                    unpaid_purchase_total: unpaidSummary[0].total || 0,
                    unpaid_purchase_count: unpaidSummary[0].count || 0,
                    last_payment_date: lastPayment.length > 0 ? lastPayment[0].created_at : null
                },
                purchases,
                ledger,
                payments
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Record payment to supplier
// @route   POST /api/suppliers/:id/payments
// @access  Private/Admin/Manager
exports.recordPayment = async (req, res) => {
    const supplierId = req.params.id;
    const { amount, payment_method, note } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [suppliers] = await connection.query('SELECT current_balance, status FROM suppliers WHERE id = ? AND shop_id = ?', [supplierId, req.shopId]);
        if (suppliers.length === 0) throw new Error('Supplier not found');
        if (suppliers[0].status !== 'active') throw new Error('Cannot pay an inactive supplier');

        const payAmount = parseFloat(amount);
        if (isNaN(payAmount) || payAmount <= 0) throw new Error('Invalid payment amount');

        const result = await supplierAccountService.recordPaymentAndAllocate(connection, {
            supplierId,
            amount: payAmount,
            paymentMethod: payment_method || 'cash',
            note,
            userId: req.user.id,
            shopId: req.shopId
        });

        await logAction(req.user.id, 'supplier_payment_created', 'supplier', supplierId, null, { amount: payAmount, method: payment_method });

        await connection.commit();
        res.json({ success: true, message: 'Payment recorded and allocated successfully', data: result });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Failed to record payment' });
    } finally {
        connection.release();
    }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private/Admin/Manager
exports.updateSupplier = async (req, res) => {
    const { name, phone, address, email, bank_account, contact_person, status, notes } = req.body;
    try {
        const [oldSupplier] = await db.query('SELECT * FROM suppliers WHERE id = ? AND shop_id = ?', [req.params.id, req.shopId]);
        if (oldSupplier.length === 0) return res.status(404).json({ success: false, message: 'Supplier not found' });

        await db.query(
            `UPDATE suppliers SET 
                name = ?, phone = ?, address = ?, email = ?, bank_account = ?, 
                contact_person = ?, status = ?, notes = ? 
             WHERE id = ? AND shop_id = ?`,
            [
                name, phone, address, email, 
                bank_account ? encrypt(bank_account) : oldSupplier[0].bank_account, 
                contact_person, status || oldSupplier[0].status, notes, 
                req.params.id, req.shopId
            ]
        );

        await logAction(req.user.id, 'supplier_updated', 'supplier', req.params.id, oldSupplier[0], req.body);
        res.json({ success: true, message: 'Supplier updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update supplier status
// @route   PATCH /api/suppliers/:id/status
// @access  Private/Admin/Manager
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        await db.query('UPDATE suppliers SET status = ? WHERE id = ? AND shop_id = ?', [status, req.params.id, req.shopId]);
        await logAction(req.user.id, 'supplier_status_changed', 'supplier', req.params.id, null, { status });
        res.json({ success: true, message: `Supplier status updated to ${status}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
