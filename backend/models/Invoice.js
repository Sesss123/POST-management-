const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
    item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    item_name: { type: String, required: true },
    qty: { type: Number, required: true },
    unit_price: { type: Number, required: true },
    total: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema({
    invoice_no: { type: String, required: true, unique: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    table_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
    invoice_type: { type: String, enum: ['cash_sale', 'table_sale', 'credit_sale'], required: true },
    payment_status: { type: String, enum: ['paid', 'unpaid', 'partial', 'cancelled'], default: 'unpaid' },
    payment_method: { type: String, enum: ['cash', 'card', 'credit'], default: 'cash' },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    grand_total: { type: Number, required: true },
    paid_amount: { type: Number, default: 0 },
    balance_amount: { type: Number, default: 0 },
    cancel_reason: { type: String },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [invoiceItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
