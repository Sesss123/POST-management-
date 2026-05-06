const { db } = require('../config/db');
const { logAction } = require('../utils/logger');
const { generateUuid } = require('../utils/identifier');
const paymentGatewayService = require('../services/payments/paymentGatewayService');
const { 
    generateInvoiceNo, 
    getSystemSettings, 
    calculatePromotionDiscount, 
    deductStock 
} = require('./invoiceController');

// @desc    Create QR Payment Request
// @route   POST /api/payments/qr/create
// @access  Private
exports.createQRRequest = async (req, res) => {
    const { source, items, discount_value, discount_type, promotion_id, customer_id, order_type = 'takeaway', waiter_id, session_id, held_bill_id } = req.body;
    const connection = await db.getConnection();

    try {
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        await connection.beginTransaction();

        const settings = await getSystemSettings(connection);
        const invoice_no = generateInvoiceNo();
        
        let subtotal = 0;
        const processedItems = [];

        // 1. Calculate subtotal (similar to invoiceController logic)
        for (const itemInput of items) {
            const [itemData] = await connection.query(
                'SELECT id, name, price, status, availability_status, track_stock, stock_qty, no_receipt_default FROM items WHERE id = ?', 
                [itemInput.item_id || itemInput.id]
            );
            
            if (itemData.length === 0) throw new Error(`Item ID ${itemInput.item_id || itemInput.id} not found`);
            const item = itemData[0];

            if (item.status !== 'active' || item.availability_status !== 'available') {
                throw new Error(`Item ${item.name} is not available`);
            }

            const itemUnitPrice = item.price; // Simplified for now, no modifiers in QR yet as per request
            const itemTotal = itemUnitPrice * itemInput.qty;
            subtotal += itemTotal;

            processedItems.push({
                item_id: item.id,
                item_name: item.name,
                qty: itemInput.qty,
                unit_price: item.price,
                total: itemTotal,
                no_receipt_item: !!item.no_receipt_default
            });
        }

        // 2. Calculate Discount & Totals
        let discount_amount = 0;
        if (discount_type === 'percentage') {
            discount_amount = (subtotal * (parseFloat(discount_value) || 0)) / 100;
        } else {
            discount_amount = parseFloat(discount_value) || 0;
        }

        const discountedSubtotal = subtotal - discount_amount;
        const promotion_discount_amount = await calculatePromotionDiscount(connection, promotion_id, discountedSubtotal);
        const finalSubtotal = Math.max(0, discountedSubtotal - promotion_discount_amount);

        const taxEnabled = settings.tax_enabled === 'true';
        const scEnabled = settings.service_charge_enabled === 'true';
        const taxRate = taxEnabled ? parseFloat(settings.tax_rate || 0) : 0;
        const scRate = scEnabled ? parseFloat(settings.service_charge_rate || 0) : 0;
        
        const taxAmount = (finalSubtotal * taxRate) / 100;
        const scAmount = (finalSubtotal * scRate) / 100;
        const grand_total = finalSubtotal + taxAmount + scAmount;

        // 3. Create PENDING Invoice
        const invoiceUuid = generateUuid();
        const [invoiceResult] = await connection.query(
            `INSERT INTO invoices (
                uuid, invoice_no, customer_id, session_id, invoice_type, order_type, waiter_id, 
                payment_status, payment_method, subtotal, discount_type, discount_value, discount, 
                promotion_id, promotion_discount_amount,
                tax_rate, tax_amount, service_charge_rate, service_charge_amount,
                grand_total, paid_amount, balance_amount, created_by,
                sale_channel, no_receipt, sale_type
            ) VALUES (?, ?, ?, ?, 'cash_sale', ?, ?, 'pending', 'qr', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'normal', false, 'restaurant')`,
            [
                invoiceUuid, invoice_no, customer_id || null, session_id || null, order_type, waiter_id || req.user.id,
                subtotal, discount_type || 'fixed', discount_value || 0, discount_amount,
                promotion_id || null, promotion_discount_amount,
                taxRate, taxAmount, scRate, scAmount,
                grand_total, grand_total, req.user.id
            ]
        );
        const invoiceId = invoiceResult.insertId;

        // 4. Insert Invoice Items
        for (const item of processedItems) {
            await connection.query(
                `INSERT INTO invoice_items (uuid, invoice_id, item_id, item_name, qty, unit_price, total, no_receipt_item)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [generateUuid(), invoiceId, item.item_id, item.item_name, item.qty, item.unit_price, item.total, item.no_receipt_item ? 1 : 0]
            );
        }

        // 5. Create Payment Transaction
        const transactionUuid = generateUuid();
        const providerName = process.env.PAYMENT_PROVIDER || 'mock';
        
        const gatewayRequest = await paymentGatewayService.createPaymentRequest({
            invoiceId,
            invoiceNo: invoice_no,
            amount: grand_total,
            currency: 'LKR',
            description: `Payment for Invoice ${invoice_no}`
        });

        await connection.query(
            `INSERT INTO payment_transactions (
                uuid, invoice_id, held_bill_id, session_id, provider, method, amount, currency, status, 
                gateway_order_id, qr_payload, qr_image_url, expires_at, request_payload, created_by
            ) VALUES (?, ?, ?, ?, ?, 'qr', ?, 'LKR', 'pending', ?, ?, ?, ?, ?, ?)`,
            [
                transactionUuid, invoiceId, held_bill_id || null, session_id || null, providerName, grand_total, 
                gatewayRequest.gateway_order_id, gatewayRequest.qr_payload, 
                gatewayRequest.qr_image_url, gatewayRequest.expires_at, 
                JSON.stringify({ items: processedItems }), req.user.id
            ]
        );

        // Update invoice with gateway info
        await connection.query(
            `UPDATE invoices SET gateway_provider = ?, gateway_order_id = ?, qr_payment_status = 'pending' WHERE id = ?`,
            [providerName, gatewayRequest.gateway_order_id, invoiceId]
        );

        // 6. Special handling for Table Billing / Held Bills
        if (session_id) {
            // Mark table session as billing pending if we had a column for it, 
            // but for now we just keep it open as per rules.
        }
        
        if (held_bill_id) {
            // Link held bill to this pending invoice if needed, 
            // or just wait for payment to complete it.
        }

        await logAction(req.user.id, 'qr_payment_created', 'invoice', invoiceId, null, { 
            invoice_no, 
            amount: grand_total, 
            gateway_order_id: gatewayRequest.gateway_order_id 
        });

        await connection.commit();

        res.status(201).json({
            success: true,
            data: {
                invoice_id: invoiceId,
                invoice_no: invoice_no,
                transaction_uuid: transactionUuid,
                amount: grand_total,
                currency: 'LKR',
                qr_payload: gatewayRequest.qr_payload,
                qr_image_url: gatewayRequest.qr_image_url,
                expires_at: gatewayRequest.expires_at
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('QR Creation Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create QR payment' });
    } finally {
        connection.release();
    }
};

// @desc    Check QR Payment Status
// @route   GET /api/payments/transactions/:uuid/status
// @access  Private
exports.checkTransactionStatus = async (req, res) => {
    const { uuid } = req.params;
    const connection = await db.getConnection();

    try {
        const [transactions] = await connection.query(
            'SELECT * FROM payment_transactions WHERE uuid = ?',
            [uuid]
        );

        if (transactions.length === 0) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        const transaction = transactions[0];
        
        // If already paid, return immediately (Idempotency Rule 4)
        if (transaction.status === 'paid') {
            const [invoices] = await connection.query('SELECT payment_status FROM invoices WHERE id = ?', [transaction.invoice_id]);
            return res.json({
                success: true,
                data: {
                    status: 'paid',
                    invoice_status: invoices[0]?.payment_status || 'paid',
                    paid_at: transaction.paid_at
                }
            });
        }

        // Call Gateway API to verify status
        const gatewayStatus = await paymentGatewayService.checkPaymentStatus({
            gateway_order_id: transaction.gateway_order_id,
            gateway_transaction_id: transaction.gateway_transaction_id
        });

        if (gatewayStatus.status === 'paid') {
            await finalizePayment(connection, transaction, gatewayStatus, req.user?.id);
        } else if (['failed', 'expired', 'cancelled'].includes(gatewayStatus.status)) {
            await connection.query(
                'UPDATE payment_transactions SET status = ?, response_payload = ? WHERE id = ?',
                [gatewayStatus.status, JSON.stringify(gatewayStatus.raw_response), transaction.id]
            );
            await connection.query(
                'UPDATE invoices SET payment_status = ?, qr_payment_status = ? WHERE id = ?',
                [gatewayStatus.status, gatewayStatus.status, transaction.invoice_id]
            );
        }

        res.json({
            success: true,
            data: {
                status: gatewayStatus.status,
                gateway_reference: gatewayStatus.gateway_reference,
                paid_at: gatewayStatus.paid_at
            }
        });

    } catch (error) {
        console.error('Status Check Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to check status' });
    } finally {
        connection.release();
    }
};

// Helper to finalize payment (Idempotent)
async function finalizePayment(connection, transaction, gatewayData, userId) {
    await connection.beginTransaction();
    try {
        // Re-check status inside transaction
        const [t] = await connection.query('SELECT status FROM payment_transactions WHERE id = ? FOR UPDATE', [transaction.id]);
        if (t[0].status === 'paid') {
            await connection.rollback();
            return;
        }

        // 1. Update Transaction
        await connection.query(
            `UPDATE payment_transactions SET 
                status = 'paid', 
                gateway_transaction_id = ?, 
                gateway_reference = ?, 
                paid_at = ?, 
                response_payload = ? 
             WHERE id = ?`,
            [
                gatewayData.gateway_transaction_id, 
                gatewayData.gateway_reference, 
                gatewayData.paid_at || new Date(), 
                JSON.stringify(gatewayData.raw_response), 
                transaction.id
            ]
        );
        
        // 1.1 Record in invoice_payments for reporting (Shift/EOD)
        const payUuid = generateUuid();
        await connection.query(
            `INSERT INTO invoice_payments (uuid, invoice_id, payment_method, amount, reference_no)
             VALUES (?, ?, ?, ?, ?)`,
            [
                payUuid, 
                transaction.invoice_id, 
                'qr', 
                transaction.amount, 
                transaction.gateway_reference || transaction.gateway_order_id
            ]
        );

        // 2. Update Invoice
        const [invoices] = await connection.query('SELECT * FROM invoices WHERE id = ?', [transaction.invoice_id]);
        const invoice = invoices[0];
        
        await connection.query(
            `UPDATE invoices SET 
                payment_status = 'paid', 
                paid_amount = grand_total, 
                balance_amount = 0,
                gateway_transaction_id = ?,
                gateway_reference = ?,
                qr_payment_status = 'paid'
             WHERE id = ?`,
            [gatewayData.gateway_transaction_id, gatewayData.gateway_reference, transaction.invoice_id]
        );

        // 3. Deduct Stock (Rule: Only deduct when paid)
        const [items] = await connection.query('SELECT item_id, qty FROM invoice_items WHERE invoice_id = ?', [transaction.invoice_id]);
        await deductStock(connection, items);

        // 4. If Table Session exists, close it
        if (invoice.session_id) {
            await connection.query(
                'UPDATE table_sessions SET status = "paid", closed_at = CURRENT_TIMESTAMP, closed_by = ? WHERE id = ?',
                [userId || invoice.created_by, invoice.session_id]
            );
            await connection.query(
                'UPDATE restaurant_tables SET status = "available" WHERE id = (SELECT table_id FROM table_sessions WHERE id = ?)',
                [invoice.session_id]
            );
        }

        // 5. If Held Bill exists, complete it
        if (transaction.held_bill_id) {
            await connection.query(
                "UPDATE held_bills SET status = 'completed', invoice_id = ?, completed_by = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?",
                [transaction.invoice_id, userId || invoice.created_by, transaction.held_bill_id]
            );
        }
        await logAction(userId || invoice.created_by, 'qr_payment_paid', 'invoice', transaction.invoice_id, null, { 
            invoice_no: invoice.invoice_no, 
            amount: transaction.amount,
            gateway_ref: gatewayData.gateway_reference
        });

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    }
}

// @desc    Mock Mark Paid (Dev Only)
// @route   POST /api/payments/mock/:uuid/mark-paid
// @access  Private
exports.mockMarkPaid = async (req, res) => {
    if (process.env.PAYMENT_PROVIDER !== 'mock' && process.env.NODE_ENV === 'production') {
        return res.status(403).json({ success: false, message: 'Mock endpoint only available in mock mode' });
    }

    const { uuid } = req.params;
    const connection = await db.getConnection();

    try {
        const [transactions] = await connection.query(
            'SELECT * FROM payment_transactions WHERE uuid = ?',
            [uuid]
        );

        if (transactions.length === 0) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        const transaction = transactions[0];
        
        const mockGatewayData = {
            status: 'paid',
            gateway_transaction_id: `MOCK-TXN-${Date.now()}`,
            gateway_reference: `REF-${Math.random().toString(36).substring(7).toUpperCase()}`,
            paid_at: new Date(),
            raw_response: { message: "Manually marked as paid in mock mode" }
        };

        await finalizePayment(connection, transaction, mockGatewayData, req.user.id);

        res.json({ success: true, message: 'Transaction marked as paid (Mock)' });

    } catch (error) {
        console.error('Mock Paid Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to mark paid' });
    } finally {
        connection.release();
    }
};

// @desc    Cancel QR Payment
// @route   POST /api/payments/transactions/:uuid/cancel
// @access  Private
exports.cancelTransaction = async (req, res) => {
    const { uuid } = req.params;
    const connection = await db.getConnection();

    try {
        const [transactions] = await connection.query(
            'SELECT * FROM payment_transactions WHERE uuid = ?',
            [uuid]
        );

        if (transactions.length === 0) return res.status(404).json({ success: false, message: 'Transaction not found' });
        
        const transaction = transactions[0];
        if (transaction.status === 'paid') return res.status(400).json({ success: false, message: 'Cannot cancel a paid transaction' });

        await connection.beginTransaction();

        await connection.query('UPDATE payment_transactions SET status = "cancelled" WHERE id = ?', [transaction.id]);
        await connection.query('UPDATE invoices SET payment_status = "cancelled", qr_payment_status = "cancelled" WHERE id = ?', [transaction.invoice_id]);

        await logAction(req.user.id, 'qr_payment_cancelled', 'invoice', transaction.invoice_id, null, { 
            gateway_order_id: transaction.gateway_order_id 
        });

        await connection.commit();
        res.json({ success: true, message: 'Transaction cancelled' });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

// @desc    Genie Webhook
// @route   POST /api/payments/webhooks/dialog-genie
// @access  Public
exports.handleGenieWebhook = async (req, res) => {
    // 1. Verify Signature
    if (!paymentGatewayService.verifyWebhookSignature(req)) {
        return res.status(401).json({ success: false, message: 'Invalid signature' });
    }

    const { gateway_order_id, status, gateway_transaction_id, gateway_reference } = req.body;
    const connection = await db.getConnection();

    try {
        const [transactions] = await connection.query(
            'SELECT * FROM payment_transactions WHERE gateway_order_id = ?',
            [gateway_order_id]
        );

        if (transactions.length === 0) return res.status(404).json({ success: false, message: 'Transaction not found' });
        const transaction = transactions[0];

        if (status === 'SUCCESS') {
            const gatewayData = {
                status: 'paid',
                gateway_transaction_id,
                gateway_reference,
                paid_at: new Date(),
                raw_response: req.body
            };
            await finalizePayment(connection, transaction, gatewayData, null);
        } else {
            // Handle failure/cancel based on Genie status codes
            await connection.query(
                'UPDATE payment_transactions SET status = "failed", callback_payload = ? WHERE id = ?',
                [JSON.stringify(req.body), transaction.id]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ success: false });
    } finally {
        connection.release();
    }
};
