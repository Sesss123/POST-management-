const { db } = require('../config/db');

// @desc    Get dashboard summary
// @route   GET /api/reports/dashboard
// @access  Private
exports.getDashboardSummary = async (req, res) => {
    try {
        // Daily totals - Today's Sales
        const [dailySales] = await db.query(`
            SELECT 
                SUM(grand_total) as todaySales,
                SUM(CASE WHEN invoice_type = 'cash_sale' THEN grand_total ELSE 0 END) as todayCash,
                SUM(CASE WHEN invoice_type = 'credit_sale' THEN grand_total ELSE 0 END) as todayCredit
            FROM invoices 
            WHERE DATE(created_at) = CURDATE() 
            AND payment_status != 'cancelled'
        `);

        const summaryData = dailySales[0].todaySales ? dailySales[0] : { todaySales: 0, todayCash: 0, todayCredit: 0 };

        // Total Naya (credit balance)
        const [nayaResult] = await db.query('SELECT SUM(current_balance) as totalNaya FROM customers');
        const totalNaya = nayaResult[0].totalNaya || 0;

        // Open tables
        const [tableResult] = await db.query('SELECT COUNT(*) as openTables FROM restaurant_tables WHERE status != "available"');
        const openTables = tableResult[0].openTables;

        // Recent invoices
        const [recentInvoices] = await db.query(`
            SELECT i.*, c.name as customer_name 
            FROM invoices i 
            LEFT JOIN customers c ON i.customer_id = c.id 
            ORDER BY i.created_at DESC 
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                summary: {
                    todaySales: parseFloat(summaryData.todaySales) || 0,
                    todayCash: parseFloat(summaryData.todayCash) || 0,
                    todayCredit: parseFloat(summaryData.todayCredit) || 0,
                    totalNaya: parseFloat(totalNaya),
                    openTables
                },
                recentInvoices
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get daily sales report
// @route   GET /api/reports/daily-sales
// @access  Private/Admin
exports.getDailySales = async (req, res) => {
    const { date } = req.query;
    const targetDate = date || 'CURDATE()';
    const queryDate = date ? '?' : '';
    
    try {
        const sql = `
            SELECT i.*, c.name as customer_name 
            FROM invoices i 
            LEFT JOIN customers c ON i.customer_id = c.id 
            WHERE DATE(i.created_at) = ${date ? '?' : 'CURDATE()'}
            AND i.payment_status != 'cancelled'
            ORDER BY i.created_at DESC
        `;
        
        const [sales] = await db.query(sql, date ? [date] : []);

        res.json({ success: true, data: sales });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get customer balance report
// @route   GET /api/reports/customer-balances
// @access  Private/Admin
exports.getCustomerBalances = async (req, res) => {
    try {
        const [balances] = await db.query(`
            SELECT * FROM customers 
            WHERE current_balance > 0 
            ORDER BY current_balance DESC
        `);
        res.json({ success: true, data: balances });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get item sales report
// @route   GET /api/reports/item-sales
// @access  Private/Admin
exports.getItemSales = async (req, res) => {
    try {
        const [sales] = await db.query(`
            SELECT 
                item_id, 
                item_name, 
                SUM(qty) as total_qty, 
                SUM(total) as total_revenue 
            FROM invoice_items ii
            JOIN invoices i ON ii.invoice_id = i.id
            WHERE i.payment_status != 'cancelled'
            GROUP BY item_id, item_name
            ORDER BY total_revenue DESC
        `);

        res.json({ success: true, data: sales });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get End-of-Day (EOD) Report
// @route   GET /api/reports/eod
// @access  Private/Admin
exports.getEODReport = async (req, res) => {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    try {
        // 1. Sales Summary (Subtotal, Discount, Tax, SC, Grand Total)
        const [salesSummary] = await db.query(`
            SELECT 
                COUNT(*) as total_invoices,
                SUM(subtotal) as total_subtotal,
                SUM(discount) as total_discount,
                SUM(tax_amount) as total_tax,
                SUM(service_charge_amount) as total_sc,
                SUM(grand_total) as total_grand
            FROM invoices 
            WHERE DATE(created_at) = ? AND payment_status != 'cancelled'`, 
            [targetDate]
        );

        // 2. Payments by Method
        const [paymentSummary] = await db.query(`
            SELECT 
                payment_method,
                SUM(amount) as total
            FROM invoice_payments 
            WHERE DATE(created_at) = ?
            GROUP BY payment_method`,
            [targetDate]
        );

        // 3. Credit Sales specifically
        const [creditSales] = await db.query(`
            SELECT SUM(grand_total) as total 
            FROM invoices 
            WHERE DATE(created_at) = ? AND payment_method = 'credit' AND payment_status != 'cancelled'`,
            [targetDate]
        );

        // 4. Customer Credit Payments received
        const [creditPayments] = await db.query(`
            SELECT SUM(amount) as total 
            FROM payments 
            WHERE DATE(created_at) = ? AND payment_method = 'cash'`,
            [targetDate]
        );

        // 5. Shift Summaries
        const [shifts] = await db.query(`
            SELECT s.*, u.name as user_name 
            FROM shifts s 
            JOIN users u ON s.user_id = u.id 
            WHERE DATE(s.start_time) = ?`,
            [targetDate]
        );

        // 6. Top Selling Items
        const [topItems] = await db.query(`
            SELECT 
                item_name, 
                SUM(qty) as total_qty, 
                SUM(total) as total_revenue 
            FROM invoice_items ii
            JOIN invoices i ON ii.invoice_id = i.id
            WHERE DATE(i.created_at) = ? AND i.payment_status != 'cancelled'
            GROUP BY item_id, item_name
            ORDER BY total_qty DESC
            LIMIT 10`,
            [targetDate]
        );

        // 7. Voids and Cancellations
        const [voids] = await db.query(`
            SELECT COUNT(*) as count 
            FROM order_items 
            WHERE DATE(created_at) = ? AND status = 'voided'`,
            [targetDate]
        );

        const [cancelledInvoices] = await db.query(`
            SELECT COUNT(*) as count 
            FROM invoices 
            WHERE DATE(created_at) = ? AND payment_status = 'cancelled'`,
            [targetDate]
        );

        res.json({
            success: true,
            data: {
                date: targetDate,
                sales: salesSummary[0],
                payments: paymentSummary,
                credit_sales: creditSales[0].total || 0,
                credit_payments_received: creditPayments[0].total || 0,
                shifts,
                top_items: topItems,
                voids: voids[0].count,
                cancelled_invoices: cancelledInvoices[0].count
            }
        });

    } catch (error) {
        console.error('EOD Report Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
