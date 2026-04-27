const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    invoice_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    payment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    type: { type: String, enum: ['debit', 'credit'], required: true },
    amount: { type: Number, required: true },
    balance_after: { type: Number, required: true },
    description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Ledger', ledgerSchema);
