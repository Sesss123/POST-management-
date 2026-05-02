const { db } = require('../config/db');
const { logAction } = require('../utils/logger');

// Helper to generate reservation number
const generateReservationNo = () => {
    return 'RES-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
};

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Private
exports.getReservations = async (req, res) => {
    const { date, status } = req.query;
    let query = `
        SELECT r.*, t.table_no, u.name as creator_name 
        FROM reservations r 
        LEFT JOIN restaurant_tables t ON r.table_id = t.id 
        LEFT JOIN users u ON r.created_by = u.id
        WHERE 1=1
    `;
    const params = [];

    if (date) {
        query += ' AND r.reservation_date = ?';
        params.push(date);
    }
    if (status) {
        query += ' AND r.status = ?';
        params.push(status);
    }

    query += ' ORDER BY r.reservation_date DESC, r.reservation_time DESC';

    try {
        const [reservations] = await db.query(query, params);
        res.json({ success: true, data: reservations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create new reservation
// @route   POST /api/reservations
// @access  Private
exports.createReservation = async (req, res) => {
    const { customer_name, phone, reservation_date, reservation_time, guests_count, table_id, note } = req.body;

    try {
        const reservation_no = generateReservationNo();
        const [result] = await db.query(
            `INSERT INTO reservations 
            (reservation_no, customer_name, phone, reservation_date, reservation_time, guests_count, table_id, note, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [reservation_no, customer_name, phone, reservation_date, reservation_time, guests_count || 1, table_id || null, note, req.user.id]
        );

        await logAction(req.user.id, 'reservation_created', 'reservations', result.insertId, null, { reservation_no, customer_name, phone });

        const [newRes] = await db.query('SELECT * FROM reservations WHERE id = ?', [result.insertId]);
        res.status(201).json({ success: true, data: newRes[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update reservation status
// @route   PATCH /api/reservations/:id/status
// @access  Private
exports.updateStatus = async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    try {
        const [oldRes] = await db.query('SELECT * FROM reservations WHERE id = ?', [id]);
        if (oldRes.length === 0) return res.status(404).json({ success: false, message: 'Reservation not found' });

        await db.query('UPDATE reservations SET status = ? WHERE id = ?', [status, id]);
        
        await logAction(req.user.id, 'reservation_status_changed', 'reservations', id, { status: oldRes[0].status }, { status });

        res.json({ success: true, message: `Reservation marked as ${status}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Assign table to reservation
// @route   PATCH /api/reservations/:id/assign-table
// @access  Private
exports.assignTable = async (req, res) => {
    const { table_id } = req.body;
    const { id } = req.params;

    try {
        await db.query('UPDATE reservations SET table_id = ? WHERE id = ?', [table_id, id]);
        res.json({ success: true, message: 'Table assigned successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
