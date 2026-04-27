const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
    table_no: { type: String, required: true, unique: true },
    status: { type: String, enum: ['available', 'occupied', 'billing'], default: 'available' }
}, { timestamps: true });

module.exports = mongoose.model('Table', tableSchema);
