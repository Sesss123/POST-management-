const { db } = require('../config/db');
const { logAction } = require('../utils/logger');
const supplierAccountService = require('../services/supplierAccountService');

// Helper to generate purchase number
const generatePurchaseNo = () => {
    const now = new Date();
    const dateStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PUR-${dateStr}-${random}`;
};

// @desc    Get all purchases
// @route   GET /api/purchases
// @access  Private/Admin/Manager
exports.getPurchases = async (req, res) => {
    try {
        const { supplier_id, payment_status, date_from, date_to, search } = req.query;
        let query = `
            SELECT p.*, s.name as supplier_name 
            FROM purchases p 
            JOIN suppliers s ON p.supplier_id = s.id 
            WHERE 1=1
        `;
        let params = [];

        if (supplier_id) {
            query += ' AND p.supplier_id = ?';
            params.push(supplier_id);
        }
        if (payment_status) {
            query += ' AND p.payment_status = ?';
            params.push(payment_status);
        }
        if (date_from) {
            query += ' AND p.purchase_date >= ?';
            params.push(date_from);
        }
        if (date_to) {
            query += ' AND p.purchase_date <= ?';
            params.push(date_to);
        }
        if (search) {
            query += ' AND (p.purchase_no LIKE ? OR s.name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY p.purchase_date DESC, p.id DESC';

        const [purchases] = await db.query(query, params);
        res.json({ success: true, data: purchases });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create purchase entry
// @route   POST /api/purchases
// @access  Private/Admin/Manager
exports.createPurchase = async (req, res) => {
    const { supplier_id, purchase_date, items, discount, paid_amount, payment_method, note } = req.body;
    const connection = await db.getConnection();

    try {
        if (!items || items.length === 0) throw new Error('Items list cannot be empty');
        
        await connection.beginTransaction();

        // 1. Validate supplier
        const [suppliers] = await connection.query('SELECT name, status, current_balance FROM suppliers WHERE id = ?', [supplier_id]);
        if (suppliers.length === 0) throw new Error('Supplier not found');
        if (suppliers[0].status !== 'active') throw new Error('Supplier is inactive');

        // 2. Calculate totals
        let subtotal = 0;
        const processedItems = items.map(item => {
            const qty = parseFloat(item.qty || 0);
            const cost = parseFloat(item.unit_cost || 0);
            if (qty <= 0) throw new Error(`Invalid quantity for ${item.item_name}`);
            const total = qty * cost;
            subtotal += total;
            return { ...item, qty, cost, total };
        });

        const disc = parseFloat(discount || 0);
        const grand_total = subtotal - disc;
        const paid = parseFloat(paid_amount || 0);
        const balance = Math.max(0, grand_total - paid);
        
        let payment_status = 'unpaid';
        if (balance === 0) payment_status = 'paid';
        else if (paid > 0) payment_status = 'partial';

        const purchase_no = generatePurchaseNo();

        // 3. Insert Purchase
        const [pResult] = await connection.query(
            `INSERT INTO purchases (purchase_no, supplier_id, purchase_date, subtotal, discount, grand_total, paid_amount, balance_amount, payment_status, note, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [purchase_no, supplier_id, purchase_date, subtotal, disc, grand_total, paid, balance, payment_status, note, req.user.id]
        );
        const purchaseId = pResult.insertId;

        // 4. Insert Purchase Items
        for (const item of processedItems) {
            await connection.query(
                `INSERT INTO purchase_items (purchase_id, item_id, item_name, qty, unit_cost, total)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [purchaseId, item.item_id || null, item.item_name, item.qty, item.cost, item.total]
            );

            // Optional: Stock Integration
            if (item.item_id) {
                await connection.query(
                    'UPDATE items SET stock_qty = stock_qty + ? WHERE id = ? AND track_stock = TRUE',
                    [item.qty, item.item_id]
                );
            }
        }

        // 5. Financial Integration (Supplier Account)
        if (balance > 0) {
            const newBalance = parseFloat(suppliers[0].current_balance) + balance;
            await connection.query('UPDATE suppliers SET current_balance = ? WHERE id = ?', [newBalance, supplier_id]);
            
            await supplierAccountService.recordPurchaseLedger(connection, {
                supplierId: supplier_id,
                purchaseId,
                amount: balance,
                newBalance,
                purchaseNo: purchase_no
            });
        }

        // 6. Record immediate payment if any
        if (paid > 0) {
            await connection.query(
                `INSERT INTO supplier_payments (supplier_id, purchase_id, amount, payment_method, note, created_by)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [supplier_id, purchaseId, paid, payment_method || 'cash', `Initial payment for ${purchase_no}`, req.user.id]
            );
        }

        await logAction(req.user.id, 'purchase_created', 'purchase', purchaseId, null, { purchase_no, supplier: suppliers[0].name, total: grand_total });

        await connection.commit();
        res.status(201).json({ success: true, message: 'Purchase recorded successfully', data: { id: purchaseId, purchase_no } });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Failed to record purchase' });
    } finally {
        connection.release();
    }
};

// @desc    Get purchase details
// @route   GET /api/purchases/:id
// @access  Private/Admin/Manager
exports.getPurchaseDetails = async (req, res) => {
    try {
        const [purchases] = await db.query(
            `SELECT p.*, s.name as supplier_name, u.name as created_by_name
             FROM purchases p
             JOIN suppliers s ON p.supplier_id = s.id
             LEFT JOIN users u ON p.created_by = u.id
             WHERE p.id = ?`,
            [req.params.id]
        );

        if (purchases.length === 0) return res.status(404).json({ success: false, message: 'Purchase not found' });

        const [items] = await db.query('SELECT * FROM purchase_items WHERE purchase_id = ?', [req.params.id]);
        
        const purchase = purchases[0];
        purchase.items = items;

        res.json({ success: true, data: purchase });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
