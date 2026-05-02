/**
 * Naya Account Service
 * Handles granular customer credit/debit operations, ledger logging, and payment allocation.
 */

/**
 * Add an invoice amount to a customer's Naya (credit) account.
 * (Handles Debit Ledger Entry internally)
 */
exports.createCreditInvoiceForCustomer = async (connection, { customerId, invoiceId, amount, description }) => {
    // 1. Fetch customer
    const [customers] = await connection.query('SELECT * FROM customers WHERE id = ? FOR UPDATE', [customerId]);
    if (customers.length === 0) throw new Error('Customer not found');
    const customer = customers[0];

    // 2. Validate status
    if (customer.status === 'blocked') {
        throw new Error(`Customer ${customer.name} is blocked and cannot receive new credit.`);
    }

    const billAmount = parseFloat(amount);
    const previousBalance = parseFloat(customer.current_balance);
    const newBalance = previousBalance + billAmount;

    // 3. Check Credit Limit (0 means unlimited)
    const limit = parseFloat(customer.credit_limit);
    if (limit > 0 && newBalance > limit) {
        throw new Error(`Transaction exceeds credit limit for ${customer.name} (Limit: Rs. ${limit.toLocaleString()}, New Balance: Rs. ${newBalance.toLocaleString()})`);
    }

    // 4. Update customer balance
    await connection.query('UPDATE customers SET current_balance = ? WHERE id = ?', [newBalance, customerId]);

    // 5. Add to Ledger (Debit)
    await exports.addInvoiceDebitToLedger(connection, {
        customerId,
        invoiceId,
        amount: billAmount,
        balanceAfter: newBalance,
        description: description || 'Credit invoice added'
    });

    return { previousBalance, newBalance };
};

/**
 * Add a debit entry to the customer ledger
 */
exports.addInvoiceDebitToLedger = async (connection, { customerId, invoiceId, amount, balanceAfter, description }) => {
    await connection.query(
        `INSERT INTO customer_ledger (customer_id, invoice_id, type, amount, balance_after, description)
         VALUES (?, ?, 'debit', ?, ?, ?)`,
        [customerId, invoiceId, amount, balanceAfter, description]
    );
};

/**
 * Record a payment into a customer's Naya account.
 * (Handles Credit Ledger Entry and Oldest-First Allocation)
 */
exports.receiveCustomerPayment = async (connection, { customerId, paymentId, amount, description }) => {
    // 1. Fetch customer
    const [customers] = await connection.query('SELECT * FROM customers WHERE id = ? FOR UPDATE', [customerId]);
    if (customers.length === 0) throw new Error('Customer not found');
    const customer = customers[0];

    const payAmount = parseFloat(amount);
    if (payAmount <= 0) throw new Error('Payment amount must be greater than zero');

    const previousBalance = parseFloat(customer.current_balance);
    const newBalance = previousBalance - payAmount;

    // 2. Update customer balance
    await connection.query('UPDATE customers SET current_balance = ? WHERE id = ?', [newBalance, customerId]);

    // 3. Insert ledger record (Credit)
    await connection.query(
        `INSERT INTO customer_ledger (customer_id, payment_id, type, amount, balance_after, description)
         VALUES (?, ?, 'credit', ?, ?, ?)`,
        [customerId, paymentId, payAmount, newBalance, description || 'Customer payment received']
    );

    // 4. Allocate payment to unpaid invoices (oldest first)
    await exports.allocatePaymentOldestFirst(connection, {
        customerId,
        paymentId,
        amount: payAmount
    });

    return { previousBalance, newBalance };
};

/**
 * Allocate a payment to unpaid/partial invoices using oldest-first rule.
 */
exports.allocatePaymentOldestFirst = async (connection, { customerId, paymentId, amount }) => {
    let remainingToAllocate = parseFloat(amount);
    
    const [unpaidInvoices] = await connection.query(
        `SELECT id, balance_amount, paid_amount 
         FROM invoices 
         WHERE customer_id = ? AND payment_status IN ('unpaid', 'partial') 
         AND balance_amount > 0
         ORDER BY created_at ASC, id ASC`,
        [customerId]
    );

    for (const inv of unpaidInvoices) {
        if (remainingToAllocate <= 0) break;

        const invBalance = parseFloat(inv.balance_amount);
        const amountToApply = Math.min(remainingToAllocate, invBalance);
        
        const newInvBalance = invBalance - amountToApply;
        const newInvPaid = parseFloat(inv.paid_amount) + amountToApply;
        const newStatus = newInvBalance <= 0 ? 'paid' : 'partial';

        // Update Invoice
        await connection.query(
            'UPDATE invoices SET balance_amount = ?, paid_amount = ?, payment_status = ? WHERE id = ?',
            [newInvBalance, newInvPaid, newStatus, inv.id]
        );

        // Log allocation
        await connection.query(
            'INSERT INTO payment_allocations (payment_id, invoice_id, allocated_amount) VALUES (?, ?, ?)',
            [paymentId, inv.id, amountToApply]
        );

        remainingToAllocate -= amountToApply;
    }
};

/**
 * Recalculate customer balance based on unpaid invoice sum.
 * Used for audits and fixing drifts.
 */
exports.recalculateCustomerBalance = async (connection, customerId) => {
    const [result] = await connection.query(
        `SELECT SUM(balance_amount) as total_unpaid 
         FROM invoices 
         WHERE customer_id = ? AND payment_status IN ('unpaid', 'partial')`,
        [customerId]
    );
    
    const totalUnpaid = parseFloat(result[0].total_unpaid || 0);
    
    await connection.query('UPDATE customers SET current_balance = ? WHERE id = ?', [totalUnpaid, customerId]);
    
    return totalUnpaid;
};

/**
 * Validate if a customer can afford a new credit transaction.
 * Throws error if limit exceeded or blocked.
 */
exports.validateCreditLimit = async (connection, { customerId, amount }) => {
    const [customers] = await connection.query('SELECT * FROM customers WHERE id = ? FOR UPDATE', [customerId]);
    if (customers.length === 0) throw new Error('Customer not found');
    const customer = customers[0];

    if (customer.status === 'blocked') {
        throw new Error(`Customer ${customer.name} is blocked and cannot receive new credit.`);
    }

    const billAmount = parseFloat(amount);
    const newBalance = parseFloat(customer.current_balance) + billAmount;
    const limit = parseFloat(customer.credit_limit);

    if (limit > 0 && newBalance > limit) {
        throw new Error(`Transaction exceeds credit limit for ${customer.name} (Limit: Rs. ${limit.toLocaleString()}, New Balance: Rs. ${newBalance.toLocaleString()})`);
    }

    return true;
};
