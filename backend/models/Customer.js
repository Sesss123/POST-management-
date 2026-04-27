const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    address: { type: String },
    nic: { type: String },
    credit_limit: { type: Number, default: 0 },
    current_balance: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
