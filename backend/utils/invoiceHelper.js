// Helper to generate invoice number
exports.generateInvoiceNo = async (connection, prefix = 'INV') => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}${random}`;
};
