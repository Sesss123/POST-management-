const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Table = require('../models/Table');

// @desc    Get dashboard summary
// @route   GET /api/reports/dashboard
// @access  Private
exports.getDashboardSummary = async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Daily totals
        const dailySummary = await Invoice.aggregate([
            { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay }, payment_status: { $ne: 'cancelled' } } },
            { $group: {
                _id: null,
                todaySales: { $sum: '$grand_total' },
                todayCash: { $sum: { $cond: [{ $eq: ['$invoice_type', 'cash_sale'] }, '$grand_total', 0] } },
                todayCredit: { $sum: { $cond: [{ $eq: ['$invoice_type', 'credit_sale'] }, '$grand_total', 0] } }
            }}
        ]);

        const summaryData = dailySummary.length > 0 ? dailySummary[0] : { todaySales: 0, todayCash: 0, todayCredit: 0 };

        // Total Naya (credit balance)
        const nayaSummary = await Customer.aggregate([
            { $group: { _id: null, totalNaya: { $sum: '$current_balance' } } }
        ]);

        const totalNaya = nayaSummary.length > 0 ? nayaSummary[0].totalNaya : 0;

        // Open tables
        const openTables = await Table.countDocuments({ status: { $ne: 'available' } });

        // Recent invoices
        const recentInvoices = await Invoice.find()
            .populate('customer_id', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            data: {
                summary: {
                    ...summaryData,
                    totalNaya,
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
    const targetDate = date ? new Date(date) : new Date();
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    try {
        const sales = await Invoice.find({
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            payment_status: { $ne: 'cancelled' }
        }).populate('customer_id', 'name');

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
        const balances = await Customer.find({ current_balance: { $gt: 0 } })
            .sort({ current_balance: -1 });
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
        const sales = await Invoice.aggregate([
            { $match: { payment_status: { $ne: 'cancelled' } } },
            { $unwind: '$items' },
            { $group: {
                _id: '$items.item_id',
                item_name: { $first: '$items.item_name' },
                total_qty: { $sum: '$items.qty' },
                total_revenue: { $sum: '$items.total' }
            }},
            { $sort: { total_revenue: -1 } }
        ]);

        res.json({ success: true, data: sales });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
