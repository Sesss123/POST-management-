const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Item = require('../models/Item');
const Table = require('../models/Table');
const Customer = require('../models/Customer');
const Ledger = require('../models/Ledger');

// Helper to generate invoice number
const generateInvoiceNo = () => {
    return 'INV-' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
};

// @desc    Create Cash Sale
// @route   POST /api/invoices/cash-sale
// @access  Private
exports.createCashSale = async (req, res) => {
    const { items, subtotal, discount, grand_total, payment_method, customer_id } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const invoice_no = generateInvoiceNo();
        
        const enrichedItems = [];
        for (const item of items) {
            const itemDoc = await Item.findById(item.id).session(session);
            if (!itemDoc) throw new Error(`Item ${item.id} not found`);
            
            enrichedItems.push({
                item_id: item.id,
                item_name: itemDoc.name,
                qty: parseInt(item.qty),
                unit_price: parseFloat(itemDoc.price),
                total: parseInt(item.qty) * parseFloat(itemDoc.price)
            });
        }

        const invoice = await Invoice.create([{
            invoice_no,
            customer_id: customer_id || null,
            invoice_type: 'cash_sale',
            payment_status: 'paid',
            payment_method,
            subtotal: parseFloat(subtotal),
            discount: parseFloat(discount) || 0,
            grand_total: parseFloat(grand_total),
            paid_amount: parseFloat(grand_total),
            balance_amount: 0,
            created_by: req.user.id,
            items: enrichedItems
        }], { session });

        await session.commitTransaction();
        res.status(201).json({ success: true, message: 'Cash sale completed', data: invoice[0] });

    } catch (error) {
        await session.abortTransaction();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Failed to process cash sale' });
    } finally {
        session.endSession();
    }
};

// @desc    Create Table Sale Pay Now
// @route   POST /api/invoices/table-sale/pay-now
// @access  Private
exports.createTableSalePayNow = async (req, res) => {
    const { table_id, items, subtotal, discount, grand_total, payment_method, customer_id } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const invoice_no = generateInvoiceNo();
        
        const enrichedItems = [];
        for (const item of items) {
            const itemDoc = await Item.findById(item.id).session(session);
            if (!itemDoc) throw new Error(`Item ${item.id} not found`);
            
            enrichedItems.push({
                item_id: item.id,
                item_name: itemDoc.name,
                qty: parseInt(item.qty),
                unit_price: parseFloat(itemDoc.price),
                total: parseInt(item.qty) * parseFloat(itemDoc.price)
            });
        }

        const invoice = await Invoice.create([{
            invoice_no,
            customer_id: customer_id || null,
            table_id,
            invoice_type: 'table_sale',
            payment_status: 'paid',
            payment_method,
            subtotal: parseFloat(subtotal),
            discount: parseFloat(discount) || 0,
            grand_total: parseFloat(grand_total),
            paid_amount: parseFloat(grand_total),
            balance_amount: 0,
            created_by: req.user.id,
            items: enrichedItems
        }], { session });

        await Table.findByIdAndUpdate(table_id, { status: 'available' }, { session });

        await session.commitTransaction();
        res.status(201).json({ success: true, message: 'Table bill paid', data: invoice[0] });

    } catch (error) {
        await session.abortTransaction();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Failed to process table payment' });
    } finally {
        session.endSession();
    }
};

// @desc    Create Table Sale Add to Credit
// @route   POST /api/invoices/table-sale/add-to-credit
// @access  Private
exports.createTableSaleCredit = async (req, res) => {
    const { table_id, customer_id, items, subtotal, discount, grand_total } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const customer = await Customer.findById(customer_id).session(session);
        if (!customer) throw new Error('Customer not found');
        if (customer.status === 'blocked') throw new Error('Customer is blocked');

        const totalToCharge = parseFloat(grand_total);
        if (customer.current_balance + totalToCharge > customer.credit_limit) {
            throw new Error('Credit limit exceeded');
        }

        const invoice_no = generateInvoiceNo();
        const enrichedItems = [];
        for (const item of items) {
            const itemDoc = await Item.findById(item.id).session(session);
            if (!itemDoc) throw new Error(`Item ${item.id} not found`);
            enrichedItems.push({
                item_id: item.id,
                item_name: itemDoc.name,
                qty: parseInt(item.qty),
                unit_price: parseFloat(itemDoc.price),
                total: parseInt(item.qty) * parseFloat(itemDoc.price)
            });
        }

        const invoice = await Invoice.create([{
            invoice_no,
            customer_id,
            table_id,
            invoice_type: 'credit_sale',
            payment_status: 'unpaid',
            payment_method: 'credit',
            subtotal: parseFloat(subtotal),
            discount: parseFloat(discount) || 0,
            grand_total: totalToCharge,
            paid_amount: 0,
            balance_amount: totalToCharge,
            created_by: req.user.id,
            items: enrichedItems
        }], { session });

        customer.current_balance += totalToCharge;
        await customer.save({ session });

        await Ledger.create([{
            customer_id,
            invoice_id: invoice[0]._id,
            type: 'debit',
            amount: totalToCharge,
            balance_after: customer.current_balance,
            description: `Credit sale: ${invoice_no}`
        }], { session });

        await Table.findByIdAndUpdate(table_id, { status: 'available' }, { session });

        await session.commitTransaction();
        res.status(201).json({ success: true, message: 'Added to Naya Book successfully', data: invoice[0] });

    } catch (error) {
        await session.abortTransaction();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Failed to process credit sale' });
    } finally {
        session.endSession();
    }
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find()
            .populate('customer_id', 'name')
            .populate('table_id', 'table_no')
            .populate('created_by', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: invoices });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get single invoice details
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoiceDetails = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('customer_id', 'name phone')
            .populate('table_id', 'table_no')
            .populate('created_by', 'name');
        
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
        res.json({ success: true, data: invoice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Cancel Invoice
// @route   PATCH /api/invoices/:id/cancel
// @access  Private/Admin
exports.cancelInvoice = async (req, res) => {
    const { reason } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const invoice = await Invoice.findById(req.params.id).session(session);
        if (!invoice) throw new Error('Invoice not found');
        if (invoice.payment_status === 'cancelled') throw new Error('Invoice already cancelled');

        invoice.payment_status = 'cancelled';
        invoice.cancel_reason = reason;
        await invoice.save({ session });

        if (invoice.invoice_type === 'credit_sale' || invoice.payment_method === 'credit') {
            const customer = await Customer.findById(invoice.customer_id).session(session);
            customer.current_balance -= invoice.grand_total;
            await customer.save({ session });

            await Ledger.create([{
                customer_id: invoice.customer_id,
                invoice_id: invoice._id,
                type: 'credit',
                amount: invoice.grand_total,
                balance_after: customer.current_balance,
                description: `Reversal of cancelled invoice: ${invoice.invoice_no}`
            }], { session });
        }

        await session.commitTransaction();
        res.json({ success: true, message: 'Invoice cancelled successfully' });

    } catch (error) {
        await session.abortTransaction();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Failed to cancel invoice' });
    } finally {
        session.endSession();
    }
};
