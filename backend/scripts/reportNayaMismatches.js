const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'backend/.env' });

async function reportMismatches() {
    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    };

    const connection = await mysql.createConnection(config);

    try {
        const [customers] = await connection.query(`
            SELECT c.id, c.name, c.phone, c.current_balance, 
                   IFNULL((SELECT SUM(balance_amount) FROM invoices WHERE customer_id = c.id AND payment_status IN ('unpaid', 'partial') AND balance_amount > 0), 0) as unpaid_invoice_sum,
                   IFNULL((SELECT COUNT(*) FROM invoices WHERE customer_id = c.id AND payment_status IN ('unpaid', 'partial') AND balance_amount > 0), 0) as unpaid_invoice_count
            FROM customers c
        `);

        console.log('==================================================');
        console.log('NAYA BOOK MISMATCH REPORT');
        console.log('==================================================\n');

        let mismatchCount = 0;
        for (const c of customers) {
            const diff = Math.abs(parseFloat(c.current_balance) - parseFloat(c.unpaid_invoice_sum));
            if (diff > 0.01) {
                mismatchCount++;
                console.log(`Customer ID: ${c.id}`);
                console.log(`Name       : ${c.name}`);
                console.log(`Phone      : ${c.phone || 'N/A'}`);
                console.log(`DB Balance : ${c.current_balance}`);
                console.log(`Invoice Sum: ${c.unpaid_invoice_sum} (${c.unpaid_invoice_count} invoices)`);
                console.log(`Difference : ${c.current_balance - c.unpaid_invoice_sum}`);

                // Check Ledger
                const [ledgerDebits] = await connection.query('SELECT SUM(amount) as total FROM customer_ledger WHERE customer_id = ? AND type = "debit"', [c.id]);
                const [ledgerCredits] = await connection.query('SELECT SUM(amount) as total FROM customer_ledger WHERE customer_id = ? AND type = "credit"', [c.id]);
                console.log(`Ledger Debits : ${ledgerDebits[0].total || 0}`);
                console.log(`Ledger Credits: ${ledgerCredits[0].total || 0}`);

                // Check if Opening Balance exists
                const [obInvoices] = await connection.query('SELECT id, invoice_no FROM invoices WHERE customer_id = ? AND invoice_no LIKE "OB-%"', [c.id]);
                if (obInvoices.length > 0) {
                    console.log(`Opening Balance Invoice: Found (${obInvoices[0].invoice_no})`);
                } else {
                    console.log(`Opening Balance Invoice: NOT FOUND`);
                }

                if (parseFloat(c.unpaid_invoice_sum) === 0 && parseFloat(c.current_balance) > 0) {
                    console.log('Recommendation: Case A - Create Opening Balance Invoice.');
                } else if (parseFloat(c.unpaid_invoice_sum) > 0) {
                    console.log('Recommendation: Case B - Sync current_balance to unpaid_invoice_sum.');
                }
                console.log('--------------------------------------------------\n');
            }
        }

        console.log(`Total Mismatches Found: ${mismatchCount}`);

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

reportMismatches();
