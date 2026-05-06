const { db } = require('../config/db');
const { logAction } = require('../utils/logger');
const { generateUuid } = require('../utils/identifier');

// @desc    Get all tickets (Super Admin)
// @route   GET /api/super-admin/tickets
// @access  Private/SuperAdmin
exports.getAllTickets = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT t.*, s.name as shop_name, u.name as user_name 
            FROM support_tickets t
            JOIN shops s ON t.shop_id = s.id
            JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update ticket status/response (Super Admin)
// @route   PUT /api/super-admin/tickets/:id
// @access  Private/SuperAdmin
exports.updateTicket = async (req, res) => {
    const { status, admin_response } = req.body;
    try {
        await db.query(
            'UPDATE support_tickets SET status = ?, admin_response = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, admin_response, req.params.id]
        );
        
        await logAction(req.user.id, 'ticket_responded', 'support_ticket', req.params.id, null, { status });
        
        res.json({ success: true, message: 'Ticket updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// --- Shop Side Ticket Routes ---

// @desc    Create a support ticket
// @route   POST /api/support/tickets
// @access  Private
exports.createTicket = async (req, res) => {
    const { subject, message, priority = 'medium' } = req.body;
    try {
        const uuid = generateUuid();
        const [result] = await db.query(
            'INSERT INTO support_tickets (uuid, shop_id, user_id, subject, message, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [uuid, req.shopId, req.user.id, subject, message, priority, 'open']
        );
        
        await logAction(req.user.id, 'ticket_created', 'support_ticket', result.insertId, null, { subject, priority });
        
        res.status(201).json({ 
            success: true, 
            message: 'Support ticket created successfully', 
            data: { id: result.insertId, uuid } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get tickets for current shop
// @route   GET /api/support/tickets
// @access  Private
exports.getShopTickets = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM support_tickets WHERE shop_id = ? ORDER BY created_at DESC',
            [req.shopId]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
