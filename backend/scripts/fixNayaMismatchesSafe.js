const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'backend/.env' });

async function fixMismatches() {
    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    };

    const connection = await mysql.createConnection(config);
    const createOpeningInvoices = process.argv.includes('--create-opening-invoices');

    try {
        const [customers] = await connection.query(`
            SELECT c.id, c.name, c.current_balance, 
                   IFNULL((SELECT SUM(balance_amount) FROM invoices WHERE customer_id = c.id AND payment_status IN ('unpaid', 'partial') AND balance_amount > 0), 0) as unpaid_invoice_sum
            FROM customers c
        `);

        console.log('==================================================');
        console.log('NAYA BOOK REPAIR PROGRESS');
        console.log('==================================================\n');

        for (const c of customers) {
            const diff = Math.abs(parseFloat(c.current_balance) - parseFloat(c.unpaid_invoice_sum));
            if (diff > 0.01) {
                console.log(`Processing Customer: ${c.name} (ID: ${c.id})`);
                
                if (parseFloat(c.unpaid_invoice_sum) === 0 && parseFloat(c.current_balance) > 0) {
                    if (createOpeningInvoices) {
                        await connection.beginTransaction();
                        try {
                            const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                            const invoiceNo = `OB-${today}-${c.id}`;
                            
                            // Check if already exists
                            const [existing] = await connection.query('SELECT id FROM invoices WHERE invoice_no = ?', [invoiceNo]);
                            if (existing.length > 0) {
                                console.log(` - SKIPPED: Opening invoice ${invoiceNo} already exists.`);
                                await connection.rollback();
                                continue;
                            }

                            // 1. Create Invoice
                            const [invResult] = await connection.query(
                                `INSERT INTO invoices (invoice_no, customer_id, invoice_type, payment_status, payment_method, subtotal, grand_total, paid_amount, balance_amount, sale_channel, no_receipt, created_by)
                                 VALUES (?, ?, 'credit_sale', 'unpaid', 'credit', ?, ?, 0, ?, 'credit_account', true, 1)`,
                                [invoiceNo, c.id, c.current_balance, c.current_balance, c.current_balance]
                            );
                            const invoiceId = invResult.insertId;

                            // 2. Create Item
                            await connection.query(
                                `INSERT INTO invoice_items (invoice_id, item_name, qty, unit_price, total)
                                 VALUES (?, 'Opening Balance', 1, ?, ?)`,
                                [invoiceId, c.current_balance, c.current_balance]
                            );

                            // 3. Create Ledger Entry if missing
                            const [ledger] = await connection.query('SELECT id FROM customer_ledger WHERE customer_id = ? AND description LIKE "%Opening balance%"', [c.id]);
                            if (ledger.length === 0) {
                                await connection.query(
                                    `INSERT INTO customer_ledger (customer_id, invoice_id, type, amount, balance_after, description)
                                     VALUES (?, ?, 'debit', ?, ?, 'Opening balance invoice created during DB repair')`,
                                    [c.id, invoiceId, c.current_balance, c.current_balance]
                                );
                            }

                            // 4. Audit Log
                            await connection.query(
                                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
                                 VALUES (1, 'opening_balance_invoice_created', 'invoice', ?, ?)`,
                                [invoiceId, JSON.stringify({ customer_id: c.id, amount: c.current_balance })]
                            );

                            await connection.commit();
                            console.log(` - FIXED: Created opening invoice ${invoiceNo} for amount ${c.current_balance}`);
                        } catch (err) {
                            await connection.rollback();
                            console.error(` - FAILED to fix customer ${c.id}:`, err.message);
                        }
                    } else {
                        console.log(` - NOTICE: Needs opening invoice for ${c.current_balance}. Run with --create-opening-invoices to fix.`);
                    }
                } else {
                    console.log(` - NOTICE: Sync mismatch detected (${c.current_balance} vs ${c.unpaid_invoice_sum}).`);
                }
            }
        }

    } catch (err) {
        console.error('General Error:', err);
    } finally {
        await connection.end();
    }
}

fixMismatches();
