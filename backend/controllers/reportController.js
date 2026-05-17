const { db } = require('../config/db');

// @desc    Get Cash Collection Report
// @route   GET /api/reports/cash-collection
// @access  Private/Admin
exports.getCashCollectionReport = async (req, res) => {
    const { from, to } = req.query;
    const startDate = from || new Date().toISOString().split('T')[0];
    const endDate = to || new Date().toISOString().split('T')[0];

    try {
        // 1. Cash from Invoices (POS & Quick Retail)
        const [invoiceCash] = await db.query(`
            SELECT 
                DATE(created_at) as date,
                'POS Sale' as type,
                invoice_no as reference,
                payment_method,
                grand_total as amount,
                created_at
            FROM invoices
            WHERE shop_id = ? 
            AND DATE(created_at) BETWEEN ? AND ?
            AND payment_method = 'cash'
            AND payment_status != 'cancelled'
        `, [req.shopId, startDate, endDate]);

        // 2. Cash from Debt (Naya) Payments
        const [debtCash] = await db.query(`
            SELECT 
                DATE(p.created_at) as date,
                'Debt Payment' as type,
                c.name as reference,
                p.payment_method,
                p.amount,
                p.created_at
            FROM payments p
            JOIN customers c ON p.customer_id = c.id
            WHERE p.shop_id = ? 
            AND DATE(p.created_at) BETWEEN ? AND ?
            AND p.payment_method = 'cash'
        `, [req.shopId, startDate, endDate]);

        // 3. Cash Movements (Manual In/Out & Drawer Expenses)
        const [movements] = await db.query(`
            SELECT 
                DATE(created_at) as date,
                CASE WHEN type = 'cash_in' THEN 'Manual Cash In' ELSE 'Manual Cash Out' END as type,
                reason as reference,
                'cash' as payment_method,
                CASE WHEN type = 'cash_in' THEN amount ELSE -amount END as amount,
                created_at
            FROM cash_movements
            WHERE shop_id = ? 
            AND DATE(created_at) BETWEEN ? AND ?
        `, [req.shopId, startDate, endDate]);

        // Merge all transactions
        const allTransactions = [...invoiceCash, ...debtCash, ...movements].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Calculate Totals
        const summary = {
            total_sales_cash: invoiceCash.reduce((sum, item) => sum + parseFloat(item.amount), 0),
            total_debt_cash: debtCash.reduce((sum, item) => sum + parseFloat(item.amount), 0),
            total_cash_in: movements.filter(m => m.amount > 0).reduce((sum, item) => sum + parseFloat(item.amount), 0),
            total_cash_out: Math.abs(movements.filter(m => m.amount < 0).reduce((sum, item) => sum + parseFloat(item.amount), 0)),
        };
        summary.net_cash = (summary.total_sales_cash + summary.total_debt_cash + summary.total_cash_in) - summary.total_cash_out;

        res.json({
            success: true,
            data: {
                summary,
                transactions: allTransactions
            }
        });
    } catch (error) {
        console.error('Cash Collection Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get dashboard summary
// @route   GET /api/reports/dashboard
// @access  Private
exports.getDashboardSummary = async (req, res) => {
    try {
        const [dailySales] = await db.query(`
            SELECT 
                SUM(grand_total) as todaySales,
                SUM(CASE WHEN sale_type = 'quick' THEN grand_total ELSE 0 END) as todayQuick,
                SUM(CASE WHEN sale_type = 'restaurant' THEN grand_total ELSE 0 END) as todayRestaurant,
                SUM(CASE WHEN payment_method = 'cash' THEN grand_total ELSE 0 END) as todayCash,
                SUM(CASE WHEN payment_method = 'card' THEN grand_total ELSE 0 END) as todayCard,
                SUM(CASE WHEN payment_method = 'qr' THEN grand_total ELSE 0 END) as todayQR,
                SUM(CASE WHEN payment_method = 'credit' THEN grand_total ELSE 0 END) as todayCredit
            FROM invoices 
            WHERE DATE(created_at) = CURDATE() 
            AND payment_status != 'cancelled'
            AND shop_id = ?
        `, [req.shopId]);

        // Today's Expenses
        const [dailyExpenses] = await db.query(`
            SELECT SUM(amount) as todayExpenses 
            FROM expenses 
            WHERE DATE(expense_date) = CURDATE() AND status = 'active' AND shop_id = ?
        `, [req.shopId]);
        const todayExpenses = parseFloat(dailyExpenses[0].todayExpenses) || 0;

        const summaryData = dailySales[0].todaySales ? dailySales[0] : { todaySales: 0, todayQuick: 0, todayRestaurant: 0, todayCash: 0, todayCard: 0, todayQR: 0, todayCredit: 0 };

        // Total Naya (credit balance)
        const [nayaResult] = await db.query('SELECT SUM(current_balance) as totalNaya FROM customers WHERE shop_id = ?', [req.shopId]);
        const totalNaya = nayaResult[0].totalNaya || 0;

        // Open tables
        const [tableResult] = await db.query('SELECT COUNT(*) as openTables FROM restaurant_tables WHERE status != "available" AND shop_id = ?', [req.shopId]);
        const openTables = tableResult[0].openTables;

        // Recent invoices
        const [recentInvoices] = await db.query(`
            SELECT i.*, c.name as customer_name 
            FROM invoices i 
            LEFT JOIN customers c ON i.customer_id = c.id 
            WHERE i.shop_id = ?
            ORDER BY i.created_at DESC 
            LIMIT 5
        `, [req.shopId]);

        // Low Stock Items
        const [lowStockItems] = await db.query(`
            SELECT id, name, stock_qty, low_stock_threshold, availability_status
            FROM items 
            WHERE status = 'active' AND track_stock = 1 AND shop_id = ?
            AND (stock_qty <= low_stock_threshold OR stock_qty <= 0 OR availability_status = 'sold_out')
            ORDER BY stock_qty ASC
            LIMIT 5
        `, [req.shopId]);

        res.json({
            success: true,
            data: {
                summary: {
                    todaySales: parseFloat(summaryData.todaySales) || 0,
                    todayQuick: parseFloat(summaryData.todayQuick) || 0,
                    todayRestaurant: parseFloat(summaryData.todayRestaurant) || 0,
                    todayCash: parseFloat(summaryData.todayCash) || 0,
                    todayCard: parseFloat(summaryData.todayCard) || 0,
                    todayQR: parseFloat(summaryData.todayQR) || 0,
                    todayCredit: parseFloat(summaryData.todayCredit) || 0,
                    todayExpenses,
                    netProfit: (parseFloat(summaryData.todaySales) || 0) - todayExpenses,
                    totalNaya: parseFloat(totalNaya),
                    openTables
                },
                recentInvoices,
                lowStockItems
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
            AND i.shop_id = ?
            ORDER BY i.created_at DESC
        `;
        
        const [sales] = await db.query(sql, date ? [date, req.shopId] : [req.shopId]);

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
            WHERE current_balance > 0 AND shop_id = ?
            ORDER BY current_balance DESC
        `, [req.shopId]);
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
            WHERE i.payment_status != 'cancelled' AND i.shop_id = ?
            GROUP BY item_id, item_name
            ORDER BY total_revenue DESC
        `, [req.shopId]);

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
            WHERE DATE(created_at) = ? AND payment_status != 'cancelled' AND shop_id = ?`, 
            [targetDate, req.shopId]
        );

        // 2. Payments by Method
        const [paymentSummary] = await db.query(`
            SELECT 
                payment_method,
                SUM(amount) as total
            FROM invoice_payments 
            WHERE DATE(created_at) = ? AND shop_id = ?
            GROUP BY payment_method`,
            [targetDate, req.shopId]
        );

        // 3. Credit Sales specifically
        const [creditSales] = await db.query(`
            SELECT SUM(grand_total) as total 
            FROM invoices 
            WHERE DATE(created_at) = ? AND payment_method = 'credit' AND payment_status != 'cancelled' AND shop_id = ?`,
            [targetDate, req.shopId]
        );

        // 4. Customer Credit Payments received
        const [creditPayments] = await db.query(`
            SELECT SUM(amount) as total 
            FROM payments 
            WHERE DATE(created_at) = ? AND payment_method = 'cash' AND shop_id = ?`,
            [targetDate, req.shopId]
        );

        // 5. Shift Summaries
        const [shifts] = await db.query(`
            SELECT s.*, u.name as user_name 
            FROM shifts s 
            JOIN users u ON s.user_id = u.id 
            WHERE DATE(s.start_time) = ? AND s.shop_id = ?`,
            [targetDate, req.shopId]
        );

        // 6. Top Selling Items
        const [topItems] = await db.query(`
            SELECT 
                item_name, 
                SUM(qty) as total_qty, 
                SUM(total) as total_revenue 
            FROM invoice_items ii
            JOIN invoices i ON ii.invoice_id = i.id
            WHERE DATE(i.created_at) = ? AND i.payment_status != 'cancelled' AND i.shop_id = ?
            GROUP BY item_id, item_name
            ORDER BY total_qty DESC
            LIMIT 10`,
            [targetDate, req.shopId]
        );

        // 7. Voids and Cancellations
        const [voids] = await db.query(`
            SELECT COUNT(*) as count 
            FROM order_items 
            WHERE DATE(created_at) = ? AND status = 'voided' AND shop_id = ?`,
            [targetDate, req.shopId]
        );

        const [cancelledInvoices] = await db.query(`
            SELECT COUNT(*) as count 
            FROM invoices 
            WHERE DATE(created_at) = ? AND payment_status = 'cancelled' AND shop_id = ?`,
            [targetDate, req.shopId]
        );

        const [quickSales] = await db.query(`
            SELECT 
                COUNT(*) as count,
                SUM(grand_total) as total
            FROM invoices 
            WHERE DATE(created_at) = ? AND payment_status != 'cancelled' AND sale_channel = 'quick_no_receipt' AND shop_id = ?`, 
            [targetDate, req.shopId]
        );

        // 9. Expenses
        const [expenses] = await db.query(`
            SELECT category, SUM(amount) as total 
            FROM expenses 
            WHERE DATE(expense_date) = ? AND status = 'active' AND shop_id = ?
            GROUP BY category`,
            [targetDate, req.shopId]
        );
        const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.total), 0);

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
                cancelled_invoices: cancelledInvoices[0].count,
                quick_sales: {
                    count: quickSales[0].count || 0,
                    total: quickSales[0].total || 0
                },
                expenses: {
                    breakdown: expenses,
                    total: totalExpenses
                },
                net_profit: (salesSummary[0].total_grand || 0) - totalExpenses
            }
        });

    } catch (error) {
        console.error('EOD Report Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get credit (Naya) summary
// @route   GET /api/reports/credit-summary
// @access  Private
exports.getCreditSummary = async (req, res) => {
    try {
        // 1. Total Outstanding & Credit Customers
        const [debtorStats] = await db.query(`
            SELECT 
                SUM(current_balance) as total_outstanding,
                COUNT(id) as credit_customers,
                SUM(CASE WHEN current_balance > credit_limit AND credit_limit > 0 THEN 1 ELSE 0 END) as over_limit_customers
            FROM customers 
            WHERE current_balance > 0 AND shop_id = ?
        `, [req.shopId]);

        // 2. Payments today
        const [paymentStats] = await db.query(`
            SELECT SUM(amount) as payments_today 
            FROM payments 
            WHERE DATE(created_at) = CURDATE() AND customer_id IS NOT NULL AND shop_id = ?
        `, [req.shopId]);

        const stats = debtorStats[0];
        const paymentsToday = paymentStats[0].payments_today || 0;

        res.json({
            success: true,
            data: {
                total_outstanding: parseFloat(stats.total_outstanding) || 0,
                credit_customers: stats.credit_customers || 0,
                payments_today: parseFloat(paymentsToday),
                over_limit_customers: stats.over_limit_customers || 0,
                naya_status: stats.over_limit_customers > 0 ? "Warning" : "Healthy"
            }
        });
    } catch (error) {
        console.error('Credit Summary Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getCashierDashboard = async (req, res) => {
    try {
        // Daily totals - Today's Sales
        const [dailySales] = await db.query(`
            SELECT 
                SUM(grand_total) as todaySales,
                SUM(CASE WHEN payment_method = 'cash' AND invoice_type = 'cash_sale' THEN grand_total ELSE 0 END) as todayCash,
                SUM(CASE WHEN payment_method = 'card' AND invoice_type = 'cash_sale' THEN grand_total ELSE 0 END) as todayCard,
                SUM(CASE WHEN payment_method = 'qr' THEN grand_total ELSE 0 END) as todayQR,
                SUM(CASE WHEN invoice_type = 'credit_sale' THEN grand_total ELSE 0 END) as todayCredit,
                COUNT(*) as invoiceCount
            FROM invoices 
            WHERE DATE(created_at) = CURDATE() 
            AND payment_status != 'cancelled'
            AND shop_id = ?
        `, [req.shopId]);

        const summaryData = dailySales[0].todaySales ? dailySales[0] : { todaySales: 0, todayCash: 0, todayCard: 0, todayQR: 0, todayCredit: 0, invoiceCount: 0 };

        // Open tables
        const [tableResult] = await db.query('SELECT COUNT(*) as openTables FROM restaurant_tables WHERE status != "available" AND shop_id = ?', [req.shopId]);
        const openTables = tableResult[0].openTables;

        // Pending held bills (if any)
        const [heldResult] = await db.query('SELECT COUNT(*) as pendingHeldBills FROM held_bills WHERE status = "held" AND shop_id = ?', [req.shopId]);
        const pendingHeldBills = heldResult[0].pendingHeldBills;

        // Recent invoices
        const [recentInvoices] = await db.query(`
            SELECT i.*, c.name as customer_name 
            FROM invoices i 
            LEFT JOIN customers c ON i.customer_id = c.id 
            WHERE i.shop_id = ?
            ORDER BY i.created_at DESC 
            LIMIT 10
        `, [req.shopId]);

        res.json({
            success: true,
            data: {
                summary: {
                    todaySales: parseFloat(summaryData.todaySales) || 0,
                    todayCash: parseFloat(summaryData.todayCash) || 0,
                    todayCard: parseFloat(summaryData.todayCard) || 0,
                    todayQR: parseFloat(summaryData.todayQR) || 0,
                    todayCredit: parseFloat(summaryData.todayCredit) || 0,
                    invoiceCount: summaryData.invoiceCount || 0,
                    openTables,
                    pendingHeldBills
                },
                recentInvoices
            }
        });
    } catch (error) {
        console.error('Cashier Dashboard Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get supplier & purchase summary
// @route   GET /api/reports/supplier-summary
// @access  Private/Admin
exports.getSupplierSummary = async (req, res) => {
    try {
        const [supplierStats] = await db.query(`
            SELECT 
                COUNT(*) as total_suppliers,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_suppliers,
                SUM(current_balance) as total_payable
            FROM suppliers
            WHERE shop_id = ?
        `, [req.shopId]);

        const [purchaseStats] = await db.query(`
            SELECT SUM(grand_total) as total 
            FROM purchases 
            WHERE DATE(created_at) = CURDATE() AND shop_id = ?
        `, [req.shopId]);

        const [paymentStats] = await db.query(`
            SELECT SUM(amount) as total 
            FROM supplier_payments 
            WHERE DATE(created_at) = CURDATE() AND shop_id = ?
        `, [req.shopId]);

        res.json({
            success: true,
            data: {
                total_suppliers: supplierStats[0].total_suppliers || 0,
                active_suppliers: supplierStats[0].active_suppliers || 0,
                total_payable: parseFloat(supplierStats[0].total_payable) || 0,
                purchases_today: parseFloat(purchaseStats[0].total) || 0,
                payments_today: parseFloat(paymentStats[0].total) || 0
            }
        });
    } catch (error) {
        console.error('Supplier Summary Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get analytical data for charts
// @route   GET /api/reports/analytics
// @access  Private/Admin
exports.getAnalytics = async (req, res) => {
    const { from, to } = req.query;
    
    // Default to last 7 days if not provided
    const startDate = from || new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = to || new Date().toISOString().split('T')[0];

    try {
        // 1. Sales Trend (Revenue vs Collection)
        // We calculate revenue from invoices and collection from both invoices (direct) and payments (debt)
        
        // Fetch Revenue
        const [revRows] = await db.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m-%d') as date, 
                SUM(grand_total) as revenue, 
                COUNT(*) as count
            FROM invoices
            WHERE DATE(created_at) BETWEEN ? AND ?
            AND payment_status != 'cancelled'
            AND shop_id = ?
            GROUP BY DATE(created_at)
        `, [startDate, endDate, req.shopId]);

        // Fetch Direct Collections (Paid at time of sale)
        const [dirCollRows] = await db.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m-%d') as date, 
                SUM(paid_amount) as amount
            FROM invoices
            WHERE DATE(created_at) BETWEEN ? AND ?
            AND payment_method != 'credit'
            AND payment_status != 'cancelled'
            AND shop_id = ?
            GROUP BY DATE(created_at)
        `, [startDate, endDate, req.shopId]);

        // Fetch Debt Collections (Payments table)
        const [debtCollRows] = await db.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m-%d') as date, 
                SUM(amount) as amount
            FROM payments
            WHERE DATE(created_at) BETWEEN ? AND ?
            AND shop_id = ?
            GROUP BY DATE(created_at)
        `, [startDate, endDate, req.shopId]);

        // Merge into a continuous timeline
        const dates = [];
        let curr = new Date(startDate);
        const end = new Date(endDate);
        while (curr <= end) {
            dates.push(curr.toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
        }

        const salesTrend = dates.map(d => {
            const rev = revRows.find(r => r.date === d);
            const dir = dirCollRows.find(r => r.date === d);
            const debt = debtCollRows.find(r => r.date === d);
            
            return {
                date: new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                revenue: parseFloat(rev?.revenue || 0),
                collection: parseFloat(dir?.amount || 0) + parseFloat(debt?.amount || 0),
                count: rev?.count || 0
            };
        });

        // 2. Category Distribution (Revenue by Category)
        const [catRows] = await db.query(`
            SELECT 
                IFNULL(i.category, 'Uncategorized') as category, 
                SUM(ii.total) as value
            FROM invoice_items ii
            JOIN items i ON ii.item_id = i.id
            JOIN invoices inv ON ii.invoice_id = inv.id
            WHERE inv.payment_status != 'cancelled'
            AND DATE(inv.created_at) BETWEEN ? AND ?
            AND inv.shop_id = ?
            GROUP BY IFNULL(i.category, 'Uncategorized')
            ORDER BY value DESC
        `, [startDate, endDate, req.shopId]);

        const categoryDist = catRows.map(r => ({
            category: r.category,
            value: parseFloat(r.value || 0)
        }));

        // 3. Payment Method Split
        const [payRows] = await db.query(`
            SELECT 
                payment_method as name, 
                SUM(grand_total) as value,
                COUNT(*) as count
            FROM invoices
            WHERE payment_status != 'cancelled'
            AND DATE(created_at) BETWEEN ? AND ?
            AND shop_id = ?
            GROUP BY payment_method
        `, [startDate, endDate, req.shopId]);

        const paymentSplit = payRows.map(r => ({
            name: r.name,
            value: parseFloat(r.value || 0),
            count: r.count
        }));

        // 4. Top 5 Items by Quantity
        const [topItemRows] = await db.query(`
            SELECT 
                item_name as name, 
                SUM(qty) as value,
                SUM(total) as revenue
            FROM invoice_items ii
            JOIN invoices inv ON ii.invoice_id = inv.id
            WHERE inv.payment_status != 'cancelled'
            AND DATE(inv.created_at) BETWEEN ? AND ?
            AND inv.shop_id = ?
            GROUP BY item_id, item_name
            ORDER BY value DESC
            LIMIT 5
        `, [startDate, endDate, req.shopId]);

        const topItems = topItemRows.map(r => ({
            name: r.name,
            value: parseInt(r.value || 0),
            revenue: parseFloat(r.revenue || 0)
        }));

        // 5. Hourly Distribution (Today - always today for 'Busy Hours')
        const [hourlyDist] = await db.query(`
            SELECT 
                HOUR(created_at) as hour, 
                COUNT(*) as count
            FROM invoices
            WHERE DATE(created_at) = CURDATE()
            AND payment_status != 'cancelled'
            AND shop_id = ?
            GROUP BY HOUR(created_at)
            ORDER BY hour ASC
        `, [req.shopId]);

        // Format hourly data for recharts (ensure all 24 hours exist)
        const formattedHourly = Array.from({ length: 24 }, (_, i) => {
            const found = hourlyDist.find(h => h.hour === i);
            return {
                hour: `${i === 0 ? '12' : i > 12 ? i - 12 : i}${i >= 12 ? 'PM' : 'AM'}`,
                count: found ? found.count : 0
            };
        });

        // 6. Quick Sales Stats
        const [quickSalesStats] = await db.query(`
            SELECT 
                COUNT(*) as count,
                SUM(grand_total) as revenue
            FROM invoices
            WHERE payment_status != 'cancelled'
            AND sale_channel = 'quick_no_receipt'
            AND DATE(created_at) BETWEEN ? AND ?
            AND shop_id = ?
        `, [startDate, endDate, req.shopId]);

        // 7. Item Type Distribution (Revenue by Item Type)
        const [typeRows] = await db.query(`
            SELECT 
                COALESCE(i.item_type, 'food') as name, 
                SUM(ii.total) as value
            FROM invoice_items ii
            JOIN items i ON ii.item_id = i.id
            JOIN invoices inv ON ii.invoice_id = inv.id
            WHERE inv.payment_status != 'cancelled'
            AND DATE(inv.created_at) BETWEEN ? AND ?
            AND inv.shop_id = ?
            GROUP BY COALESCE(i.item_type, 'food')
            ORDER BY value DESC
        `, [startDate, endDate, req.shopId]);

        const itemTypeDist = typeRows.map(r => ({
            name: r.name,
            value: parseFloat(r.value || 0)
        }));

        res.json({
            success: true,
            data: {
                range: { from: startDate, to: endDate },
                salesTrend,
                categoryDist,
                paymentSplit,
                topItems,
                hourlyDist: formattedHourly,
                quickSales: {
                    count: quickSalesStats[0].count || 0,
                    revenue: quickSalesStats[0].revenue || 0
                },
                itemTypeDist
            }
        });
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get dashboard alerts
// @route   GET /api/reports/alerts
// @access  Private/Admin
exports.getAlerts = async (req, res) => {
    try {
        const alerts = {
            naya: [],
            stock: [],
            held_bills: [],
            kitchen: [],
            suppliers: [],
            cash: []
        };

        // 1. High Naya Risk
        const [debtorAlerts] = await db.query(`
            SELECT id, name, current_balance, credit_limit 
            FROM customers 
            WHERE ((current_balance > credit_limit AND credit_limit > 0)
            OR (current_balance > 0)) AND shop_id = ?
            ORDER BY current_balance DESC 
            LIMIT 10
        `, [req.shopId]);
        
        debtorAlerts.forEach(d => {
            if (parseFloat(d.current_balance) > parseFloat(d.credit_limit) && parseFloat(d.credit_limit) > 0) {
                alerts.naya.push({
                    title: 'Credit Limit Exceeded',
                    description: `${d.name} is over credit limit by Rs. ${(parseFloat(d.current_balance) - parseFloat(d.credit_limit)).toLocaleString()}`,
                    severity: 'critical',
                    amount: parseFloat(d.current_balance),
                    link: `/customers/${d.id}/ledger`
                });
            } else if (alerts.naya.length < 5) {
                alerts.naya.push({
                    title: 'High Debt Balance',
                    description: `${d.name} has an outstanding balance of Rs. ${parseFloat(d.current_balance).toLocaleString()}`,
                    severity: 'warning',
                    amount: parseFloat(d.current_balance),
                    link: `/customers/${d.id}/ledger`
                });
            }
        });

        // 2. Low Stock & Inventory Status
        const [stockAlerts] = await db.query(`
            SELECT id, name, stock_qty, low_stock_threshold, availability_status
            FROM items 
            WHERE status = 'active' AND track_stock = 1 AND shop_id = ?
            AND (stock_qty <= low_stock_threshold OR stock_qty <= 0 OR availability_status = 'sold_out')
            ORDER BY stock_qty ASC, availability_status DESC
            LIMIT 10
        `, [req.shopId]);

        stockAlerts.forEach(s => {
            const isSoldOut = s.stock_qty <= 0 || s.availability_status === 'sold_out';
            alerts.stock.push({
                title: isSoldOut ? 'Item Sold Out' : 'Low Stock Alert',
                description: `${s.name} ${isSoldOut ? 'is currently sold out' : `is running low (Qty: ${s.stock_qty})`}`,
                severity: isSoldOut ? 'critical' : 'warning',
                amount: s.stock_qty,
                link: '/items'
            });
        });

        // 3. Pending Held Bills
        const [heldAlerts] = await db.query(`
            SELECT id, hold_no, created_at, TIMESTAMPDIFF(HOUR, created_at, NOW()) as hours_old
            FROM held_bills 
            WHERE status IN ('held', 'resumed') AND shop_id = ?
            ORDER BY created_at ASC
        `, [req.shopId]);

        heldAlerts.forEach(h => {
            alerts.held_bills.push({
                title: 'Pending Held Bill',
                description: `${h.hold_no || `Bill #${h.id}`} has been parked for ${h.hours_old} hours`,
                severity: h.hours_old > 5 ? 'critical' : 'info',
                link: '/held-bills'
            });
        });

        // 4. Slow Kitchen Orders
        const [kitchenAlerts] = await db.query(`
            SELECT k.id, k.kot_no, k.created_at, TIMESTAMPDIFF(MINUTE, k.created_at, NOW()) as mins_old, t.table_no
            FROM kot_orders k
            LEFT JOIN restaurant_tables t ON k.table_id = t.id
            WHERE k.status IN ('pending', 'preparing') AND k.shop_id = ?
            HAVING mins_old > 20
            ORDER BY mins_old DESC
        `, [req.shopId]);

        kitchenAlerts.forEach(k => {
            alerts.kitchen.push({
                title: 'Delayed Order',
                description: `${k.kot_no} ${k.table_no ? `(Table: ${k.table_no})` : ''} delayed by ${k.mins_old} mins`,
                severity: k.mins_old > 40 ? 'critical' : 'warning',
                link: '/kitchen'
            });
        });

        // 5. Supplier Payables
        const [supplierAlerts] = await db.query(`
            SELECT id, name, current_balance 
            FROM suppliers 
            WHERE current_balance > 0 AND status = 'active' AND shop_id = ?
            ORDER BY current_balance DESC
            LIMIT 5
        `, [req.shopId]);

        supplierAlerts.forEach(s => {
            alerts.suppliers.push({
                title: 'Supplier Payable',
                description: `Pending payment for ${s.name}: Rs. ${parseFloat(s.current_balance).toLocaleString()}`,
                severity: parseFloat(s.current_balance) > 50000 ? 'warning' : 'info',
                link: '/suppliers'
            });
        });

        // 6. Cash Control (Open Shifts & Differences)
        const [shiftAlerts] = await db.query(`
            SELECT s.id, s.start_time, u.name as user_name, TIMESTAMPDIFF(HOUR, s.start_time, NOW()) as hours_open, s.difference, s.status
            FROM shifts s
            JOIN users u ON s.user_id = u.id
            WHERE (s.status = 'open' 
            OR (s.status = 'closed' AND ABS(s.difference) > 0 AND s.end_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)))
            AND s.shop_id = ?
        `, [req.shopId]);

        shiftAlerts.forEach(s => {
            if (s.status === 'open') {
                alerts.cash.push({
                    title: 'Open Shift Alert',
                    description: `Shift by ${s.user_name} is open for ${s.hours_open} hours`,
                    severity: s.hours_open > 12 ? 'warning' : 'info',
                    link: '/shifts'
                });
            } else {
                alerts.cash.push({
                    title: 'Shift Cash Mismatch',
                    description: `${s.user_name} closed with difference of Rs. ${parseFloat(s.difference).toLocaleString()}`,
                    severity: 'critical',
                    link: '/shifts'
                });
            }
        });

        // 6b. No Open Shift Alert
        const hasOpenShift = shiftAlerts.some(s => s.status === 'open');
        if (!hasOpenShift) {
            alerts.cash.push({
                title: 'No Open Shift',
                description: 'Terminal is inactive. Please open a shift to start billing.',
                severity: 'critical',
                link: '/shifts'
            });
        }

        res.json({
            success: true,
            data: alerts
        });

    } catch (error) {
        console.error('Alerts Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get Business Intelligence Report
// @route   GET /api/reports/business-intelligence
// @access  Private/Admin
exports.getBusinessIntelligence = async (req, res) => {
    const { from, to, range } = req.query;
    
    let startDate, endDate;
    const now = new Date();
    
    if (range === 'today') {
        startDate = now.toISOString().split('T')[0];
        endDate = startDate;
    } else if (range === '7d') {
        startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
    } else if (range === '30d') {
        startDate = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
    } else if (range === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
    } else {
        startDate = from || new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        endDate = to || now.toISOString().split('T')[0];
    }

    try {
        // 1. KPIs
        const [kpiRows] = await db.query(`
            SELECT 
                SUM(grand_total) as sales_revenue,
                SUM(paid_amount) as cash_collected,
                COUNT(*) as total_orders,
                SUM(CASE WHEN sale_channel = 'quick_no_receipt' THEN grand_total ELSE 0 END) as quick_retail_revenue
            FROM invoices 
            WHERE DATE(created_at) BETWEEN ? AND ? 
            AND payment_status != 'cancelled' AND shop_id = ?`,
            [startDate, endDate, req.shopId]
        );

        // Expenses in range
        const [expenseRows] = await db.query(`
            SELECT SUM(amount) as total_expenses 
            FROM expenses 
            WHERE DATE(expense_date) BETWEEN ? AND ? 
            AND status = 'active' AND shop_id = ?`,
            [startDate, endDate, req.shopId]
        );

        const [nayaResult] = await db.query('SELECT SUM(current_balance) as total_outstanding FROM customers WHERE shop_id = ?', [req.shopId]);
        
        const kpis = kpiRows[0];
        const total_expenses = parseFloat(expenseRows[0].total_expenses) || 0;
        const credit_outstanding = parseFloat(nayaResult[0].total_outstanding) || 0;
        const sales_revenue = parseFloat(kpis.sales_revenue) || 0;
        const total_orders = kpis.total_orders || 0;
        const average_bill_value = total_orders > 0 ? (sales_revenue / total_orders) : 0;
        const net_profit = sales_revenue - total_expenses;

        // 2. Sales Trend
        const [salesTrend] = await db.query(`
            SELECT 
                DATE_FORMAT(created_at, '%b %d') as date, 
                SUM(grand_total) as revenue, 
                SUM(paid_amount) as collected
            FROM invoices
            WHERE DATE(created_at) BETWEEN ? AND ?
            AND payment_status != 'cancelled' AND shop_id = ?
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) ASC
        `, [startDate, endDate, req.shopId]);

        // 3. Order Type Breakdown
        const [orderTypeBreakdown] = await db.query(`
            SELECT 
                CASE 
                    WHEN sale_channel = 'quick_no_receipt' THEN 'Quick Retail'
                    ELSE COALESCE(order_type, 'Direct')
                END as name,
                SUM(grand_total) as value
            FROM invoices
            WHERE DATE(created_at) BETWEEN ? AND ?
            AND payment_status != 'cancelled' AND shop_id = ?
            GROUP BY name
        `, [startDate, endDate, req.shopId]);
        // 4. Top Items
        const [topItems] = await db.query(`
            SELECT 
                item_name as name, 
                SUM(qty) as qty, 
                SUM(total) as revenue
            FROM invoice_items ii
            JOIN invoices i ON ii.invoice_id = i.id
            WHERE DATE(i.created_at) BETWEEN ? AND ?
            AND i.payment_status != 'cancelled' AND i.shop_id = ?
            GROUP BY item_id, item_name
            ORDER BY revenue DESC
            LIMIT 10
        `, [startDate, endDate, req.shopId]);

        // 4.1 Worst Selling Items (Items with 0 sales in period, or lowest sales)
        const [worstItems] = await db.query(`
            SELECT 
                i.name as name, 
                COALESCE(SUM(ii.qty), 0) as qty,
                COALESCE(SUM(ii.total), 0) as revenue
            FROM items i
            LEFT JOIN invoice_items ii ON i.id = ii.item_id 
            LEFT JOIN invoices inv ON ii.invoice_id = inv.id AND DATE(inv.created_at) BETWEEN ? AND ? AND inv.payment_status != 'cancelled'
            WHERE i.shop_id = ? AND i.status = 'active'
            GROUP BY i.id, i.name
            ORDER BY revenue ASC, qty ASC
            LIMIT 10
        `, [startDate, endDate, req.shopId]);

        // 5. Category Performance
        const [catPerfRows] = await db.query(`
            SELECT 
                COALESCE(i.category, 'Uncategorized') as name, 
                SUM(ii.total) as value
            FROM invoice_items ii
            JOIN items i ON ii.item_id = i.id
            JOIN invoices inv ON ii.invoice_id = inv.id
            WHERE DATE(inv.created_at) BETWEEN ? AND ?
            AND inv.payment_status != 'cancelled' AND inv.shop_id = ?
            GROUP BY name
            ORDER BY value DESC
        `, [startDate, endDate, req.shopId]);

        const categoryPerformance = catPerfRows.map(r => ({
            name: r.name,
            value: parseFloat(r.value || 0)
        }));

        // 6. Hourly Sales
        const [hourlyRaw] = await db.query(`
            SELECT 
                HOUR(created_at) as hour, 
                COUNT(*) as count,
                SUM(grand_total) as revenue
            FROM invoices
            WHERE DATE(created_at) BETWEEN ? AND ?
            AND payment_status != 'cancelled' AND shop_id = ?
            GROUP BY hour
            ORDER BY hour ASC
        `, [startDate, endDate, req.shopId]);

        const hourly_sales = Array.from({ length: 24 }, (_, i) => {
            const found = hourlyRaw.find(h => h.hour === i);
            return {
                hour: `${i === 0 ? '12' : i > 12 ? i - 12 : i}${i >= 12 ? 'PM' : 'AM'}`,
                count: found ? found.count : 0,
                revenue: found ? parseFloat(found.revenue) : 0
            };
        });

        // 7. Naya Risk
        const [topDebtors] = await db.query(`
            SELECT name, current_balance as balance, credit_limit 
            FROM customers 
            WHERE current_balance > 0 AND shop_id = ?
            ORDER BY balance DESC 
            LIMIT 5
        `, [req.shopId]);

        const [overLimit] = await db.query(`
            SELECT name, current_balance as balance, credit_limit 
            FROM customers 
            WHERE current_balance > credit_limit AND credit_limit > 0 AND shop_id = ?
        `, [req.shopId]);

        // 8. Kitchen Performance
        const [kitchenStats] = await db.query(`
            SELECT 
                AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as avg_time,
                COUNT(CASE WHEN TIMESTAMPDIFF(MINUTE, created_at, updated_at) > 30 AND status = 'ready' THEN 1 END) as delayed_count
            FROM kot_orders
            WHERE status != 'cancelled' AND DATE(created_at) BETWEEN ? AND ? AND shop_id = ?
        `, [startDate, endDate, req.shopId]);

        const [slowestOrders] = await db.query(`
            SELECT kot_no, TIMESTAMPDIFF(MINUTE, created_at, NOW()) as mins_old
            FROM kot_orders
            WHERE status IN ('pending', 'preparing')
            AND DATE(created_at) = CURDATE() AND shop_id = ?
            ORDER BY mins_old DESC
            LIMIT 5
        `, [req.shopId]);

        // 9. Quick Retail
        const [quickRetailStats] = await db.query(`
            SELECT 
                COUNT(*) as count,
                SUM(grand_total) as revenue
            FROM invoices
            WHERE sale_channel = 'quick_no_receipt'
            AND DATE(created_at) BETWEEN ? AND ?
            AND payment_status != 'cancelled' AND shop_id = ?
        `, [startDate, endDate, req.shopId]);

        // 10. Suppliers
        const [supplierStats] = await db.query(`
            SELECT 
                SUM(current_balance) as total_payable,
                COUNT(CASE WHEN current_balance > 0 THEN 1 END) as active_debtors
            FROM suppliers
            WHERE shop_id = ?
        `, [req.shopId]);

        const [topSuppliers] = await db.query(`
            SELECT name, current_balance as balance 
            FROM suppliers 
            WHERE current_balance > 0 AND shop_id = ?
            ORDER BY balance DESC 
            LIMIT 5
        `, [req.shopId]);

        // 11. Stock Risk
        const [lowStock] = await db.query(`
            SELECT name, stock_qty, low_stock_threshold 
            FROM items 
            WHERE track_stock = 1 AND stock_qty <= low_stock_threshold AND status = 'active' AND shop_id = ?
            ORDER BY stock_qty ASC
        `, [req.shopId]);

        // Insights Generation
        const insights = [];
        if (total_orders > 0) {
            const peakHour = hourly_sales.reduce((max, h) => h.count > max.count ? h : max, hourly_sales[0]);
            insights.push({ type: 'info', text: `Peak sales activity typically occurs around ${peakHour.hour}.` });
        }
        if (overLimit.length > 0) {
            insights.push({ type: 'warning', text: `${overLimit.length} customers have exceeded their credit limits.` });
        }
        if (lowStock.length > 0) {
            insights.push({ type: 'danger', text: `${lowStock.length} items are currently low on stock or sold out.` });
        }
        if (quickRetailStats[0].count > 0) {
            insights.push({ type: 'success', text: `Quick Retail contributed Rs. ${parseFloat(quickRetailStats[0].revenue).toLocaleString()} to revenue.` });
        }
        if (kitchenStats[0].delayed_count > 0) {
            insights.push({ type: 'warning', text: `${kitchenStats[0].delayed_count} KOTs were delayed over 30 minutes in the selected period.` });
        }

        res.json({
            success: true,
            data: {
                range: { from: startDate, to: endDate },
                kpis: {
                    sales_revenue,
                    total_expenses,
                    net_profit,
                    cash_collected: parseFloat(kpis.cash_collected) || 0,
                    credit_outstanding,
                    average_bill_value,
                    total_orders,
                    quick_retail_revenue: parseFloat(kpis.quick_retail_revenue) || 0
                },
                sales_trend: salesTrend,
                order_type_breakdown: orderTypeBreakdown,
                top_items: topItems,
                worst_items: worstItems,
                category_performance: categoryPerformance,
                hourly_sales,
                naya_risk: {
                    total_outstanding: credit_outstanding,
                    top_debtors: topDebtors,
                    over_limit_customers: overLimit
                },
                kitchen_performance: {
                    average_prep_minutes: parseFloat(kitchenStats[0].avg_time) || 0,
                    delayed_kots: kitchenStats[0].delayed_count || 0,
                    slowest_orders: slowestOrders
                },
                quick_retail: {
                    sales_count: quickRetailStats[0].count || 0,
                    revenue: parseFloat(quickRetailStats[0].revenue) || 0,
                    top_items: [] // Could be added if needed
                },
                suppliers: {
                    total_payable: parseFloat(supplierStats[0].total_payable) || 0,
                    top_payables: topSuppliers,
                    unpaid_purchase_count: 0 // Placeholder
                },
                stock: {
                    low_stock_items: lowStock.slice(0, 5),
                    sold_out_items: lowStock.filter(i => i.stock_qty <= 0)
                },
                insights
            }
        });

    } catch (error) {
        console.error('BI Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
