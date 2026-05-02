const { db } = require('../config/db');

/**
 * Handle supplier ledgering and payment allocations
 */
const supplierAccountService = {
    /**
     * Records a purchase in the supplier ledger
     */
    recordPurchaseLedger: async (connection, { supplierId, purchaseId, amount, newBalance, purchaseNo }) => {
        await connection.query(
            `INSERT INTO supplier_ledger (supplier_id, purchase_id, type, amount, balance_after, description)
             VALUES (?, ?, 'debit', ?, ?, ?)`,
            [supplierId, purchaseId, amount, newBalance, `Purchase ${purchaseNo} added to account`]
        );
    },

    /**
     * Records a payment and allocates it to oldest purchases
     */
    recordPaymentAndAllocate: async (connection, { supplierId, amount, paymentMethod, note, userId }) => {
        // 1. Insert payment record
        const [payResult] = await connection.query(
            `INSERT INTO supplier_payments (supplier_id, amount, payment_method, note, created_by)
             VALUES (?, ?, ?, ?, ?)`,
            [supplierId, amount, paymentMethod, note, userId]
        );
        const paymentId = payResult.insertId;

        // 2. Update supplier balance
        await connection.query(
            'UPDATE suppliers SET current_balance = current_balance - ? WHERE id = ?',
            [amount, supplierId]
        );

        // 3. Get new balance for ledger
        const [supplier] = await connection.query('SELECT current_balance FROM suppliers WHERE id = ?', [supplierId]);
        const newBalance = supplier[0].current_balance;

        // 4. Record in ledger
        await connection.query(
            `INSERT INTO supplier_ledger (supplier_id, payment_id, type, amount, balance_after, description)
             VALUES (?, ?, 'credit', ?, ?, ?)`,
            [supplierId, paymentId, 'credit', amount, newBalance, `Supplier payment made - ${paymentMethod}`]
        );

        // 5. Allocate payment to oldest unpaid/partial purchases
        let remainingToAllocate = parseFloat(amount);
        
        const [purchases] = await connection.query(
            `SELECT id, balance_amount, paid_amount, grand_total 
             FROM purchases 
             WHERE supplier_id = ? AND payment_status IN ('unpaid', 'partial') AND balance_amount > 0
             ORDER BY purchase_date ASC, id ASC`,
            [supplierId]
        );

        for (const purchase of purchases) {
            if (remainingToAllocate <= 0) break;

            const allocated = Math.min(remainingToAllocate, parseFloat(purchase.balance_amount));
            const newPaidAmount = parseFloat(purchase.paid_amount) + allocated;
            const newBalanceAmount = parseFloat(purchase.balance_amount) - allocated;
            const newStatus = newBalanceAmount === 0 ? 'paid' : 'partial';

            // Update purchase record
            await connection.query(
                `UPDATE purchases SET paid_amount = ?, balance_amount = ?, payment_status = ? WHERE id = ?`,
                [newPaidAmount, newBalanceAmount, newStatus, purchase.id]
            );

            // Record allocation
            await connection.query(
                `INSERT INTO supplier_payment_allocations (supplier_payment_id, purchase_id, allocated_amount)
                 VALUES (?, ?, ?)`,
                [paymentId, purchase.id, allocated]
            );

            remainingToAllocate -= allocated;
        }

        return { paymentId, newBalance };
    }
};

module.exports = supplierAccountService;
