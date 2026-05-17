const { db } = require('../config/db');

async function fixReservationsTable() {
    const connection = await db.getConnection();
    try {
        console.log('Starting reservations table migration...');
        await connection.beginTransaction();

        // 1. Add uuid and reservation_no
        console.log('Adding missing columns...');
        await connection.query(`
            ALTER TABLE reservations 
            ADD COLUMN IF NOT EXISTS uuid VARCHAR(36) AFTER id,
            ADD COLUMN IF NOT EXISTS reservation_no VARCHAR(20) AFTER shop_id
        `);

        // 2. Rename customer_phone to phone if exists
        console.log('Renaming customer_phone to phone...');
        try {
            await connection.query('ALTER TABLE reservations CHANGE COLUMN customer_phone phone VARCHAR(20)');
        } catch (e) {
            console.log('phone column already exists or customer_phone missing');
        }

        // 3. Rename guest_count to guests_count if exists
        console.log('Renaming guest_count to guests_count...');
        try {
            await connection.query('ALTER TABLE reservations CHANGE COLUMN guest_count guests_count INT(11) DEFAULT 1');
        } catch (e) {
            console.log('guests_count column already exists or guest_count missing');
        }

        // 4. Add seated_at, cancelled_at, cancel_reason (for completeness)
        console.log('Adding tracking columns...');
        await connection.query(`
            ALTER TABLE reservations 
            ADD COLUMN IF NOT EXISTS seated_at TIMESTAMP NULL AFTER note,
            ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP NULL AFTER seated_at,
            ADD COLUMN IF NOT EXISTS cancel_reason TEXT AFTER cancelled_at
        `);

        // 5. Update existing rows with UUIDs if missing
        const [rows] = await connection.query('SELECT id FROM reservations WHERE uuid IS NULL');
        const { generateUuid } = require('../utils/identifier');
        for (const row of rows) {
            await connection.query('UPDATE reservations SET uuid = ? WHERE id = ?', [generateUuid(), row.id]);
        }

        await connection.commit();
        console.log('Migration completed successfully!');
    } catch (error) {
        await connection.rollback();
        console.error('Migration failed:', error);
    } finally {
        connection.release();
        process.exit();
    }
}

fixReservationsTable();
