const mysql = require('mysql2/promise');
const crypto = require('crypto');

function generateUuid() {
    return crypto.randomUUID();
}

async function seed() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'restoledgerdb'
    });

    console.log('🌱 Seeding support tickets...');

    const tickets = [
        {
            shop_id: 1,
            user_id: 1,
            subject: 'Printer Connection Protocol Failure',
            message: 'Our thermal printer is not responding to the KOT signal. Protocol sync seems to be interrupted.',
            priority: 'high',
            status: 'open'
        },
        {
            shop_id: 2,
            user_id: 2,
            subject: 'Intelligence Dashboard Discrepancy',
            message: 'The daily revenue matrix is showing a 0.5% variance compared to the local ledger.',
            priority: 'medium',
            status: 'pending'
        },
        {
            shop_id: 3,
            user_id: 3,
            subject: 'New Agent Onboarding',
            message: 'Requesting access for a new cashier agent in the Elite Grill sector.',
            priority: 'low',
            status: 'resolved',
            admin_response: 'Access has been granted. Protocol initialized.',
            responded_at: new Date()
        },
        {
            shop_id: 1,
            user_id: 1,
            subject: 'Thermal Load Warning',
            message: 'System reporting high thermal load on Node-04. Please check telemetry data.',
            priority: 'high',
            status: 'open'
        }
    ];

    try {
        // Clear existing demo tickets if any (optional)
        // await connection.query('DELETE FROM support_tickets WHERE subject LIKE "%Protocol%" OR subject LIKE "%Matrix%"');

        for (const t of tickets) {
            const uuid = generateUuid();
            await connection.query(
                'INSERT INTO support_tickets (uuid, shop_id, user_id, subject, message, priority, status, admin_response, responded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [uuid, t.shop_id, t.user_id, t.subject, t.message, t.priority, t.status, t.admin_response || null, t.responded_at || null]
            );
        }

        console.log('✅ Seeding completed successfully!');
    } catch (err) {
        console.error('❌ Seeding failed:', err);
    } finally {
        await connection.end();
    }
}

seed();
