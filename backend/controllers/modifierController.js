const { db } = require('../config/db');
const { logAction } = require('../utils/logger');
const { buildIdOrUuidWhere, generateUuid } = require('../utils/identifier');

// @desc    Get all active modifiers
// @route   GET /api/modifiers
// @access  Private
exports.getModifiers = async (req, res) => {
    try {
        const { status, type } = req.query;
        let query = 'SELECT * FROM item_modifiers WHERE shop_id = ?';
        const params = [req.shopId];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        } else {
            query += ' AND status = "active"';
        }

        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }

        query += ' ORDER BY type, name';

        const [modifiers] = await db.query(query, params);
        res.json({ success: true, data: modifiers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create a modifier
// @route   POST /api/modifiers
// @access  Private/Admin
exports.createModifier = async (req, res) => {
    const { name, type, price_delta, category } = req.body;
    try {
        const uuid = generateUuid();
        const [result] = await db.query(
            'INSERT INTO item_modifiers (uuid, name, type, price_delta, category, shop_id) VALUES (?, ?, ?, ?, ?, ?)',
            [uuid, name, type, price_delta || 0, category, req.shopId]
        );
        await logAction(req.user.id, 'modifier_created', 'item_modifier', result.insertId, null, { name, type, price_delta, uuid });
        res.status(201).json({ success: true, message: 'Modifier created', data: { id: result.insertId, uuid } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update a modifier
// @route   PUT /api/modifiers/:id
// @access  Private/Admin
exports.updateModifier = async (req, res) => {
    const { name, type, price_delta, category, status } = req.body;
    try {
        const where = buildIdOrUuidWhere(null, req.params.id);
        const [oldMod] = await db.query(`SELECT id FROM item_modifiers WHERE ${where.query} AND shop_id = ?`, [where.value, req.shopId]);
        if (oldMod.length === 0) return res.status(404).json({ success: false, message: 'Modifier not found' });
        const modifierId = oldMod[0].id;

        await db.query(
            'UPDATE item_modifiers SET name = ?, type = ?, price_delta = ?, category = ?, status = ? WHERE id = ? AND shop_id = ?',
            [name, type, price_delta, category, status, modifierId, req.shopId]
        );
        await logAction(req.user.id, 'modifier_updated', 'item_modifier', modifierId, null, req.body);
        res.json({ success: true, message: 'Modifier updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
