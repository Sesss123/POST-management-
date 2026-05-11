const { db } = require('../config/db');
const { logAction } = require('../utils/logger');

// @desc    Get all active combos
// @route   GET /api/combos
// @access  Private
exports.getCombos = async (req, res) => {
    try {
        const [combos] = await db.query('SELECT * FROM combo_meals WHERE status = "active" AND shop_id = ?', [req.shopId]);
        
        // Fetch items for each combo
        for (let combo of combos) {
            const [items] = await db.query(`
                SELECT ci.qty, i.id, i.name, i.price 
                FROM combo_items ci 
                JOIN items i ON ci.item_id = i.id 
                WHERE ci.combo_id = ? AND ci.shop_id = ? AND i.shop_id = ?
            `, [combo.id, req.shopId, req.shopId]);
            combo.items = items;
        }

        res.json({ success: true, data: combos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create new combo meal
// @route   POST /api/combos
// @access  Private/Admin
exports.createCombo = async (req, res) => {
    const { name, description, price, items } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [result] = await connection.query(
            'INSERT INTO combo_meals (name, description, price, shop_id) VALUES (?, ?, ?, ?)',
            [name, description, price, req.shopId]
        );
        const comboId = result.insertId;

        for (const item of items) {
            await connection.query(
                'INSERT INTO combo_items (combo_id, item_id, qty, shop_id) VALUES (?, ?, ?, ?)',
                [comboId, item.id, item.qty, req.shopId]
            );
        }

        await logAction(req.user.id, 'combo_created', 'combo_meals', comboId, null, { name, price });

        await connection.commit();
        res.status(201).json({ success: true, message: 'Combo meal created successfully' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        connection.release();
    }
};

// @desc    Delete/Deactivate combo
// @route   DELETE /api/combos/:id
// @access  Private/Admin
exports.deleteCombo = async (req, res) => {
    try {
        await db.query('UPDATE combo_meals SET status = "inactive" WHERE id = ? AND shop_id = ?', [req.params.id, req.shopId]);
        
        await logAction(req.user.id, 'combo_deactivated', 'combo_meals', req.params.id, null, { status: 'inactive' });

        res.json({ success: true, message: 'Combo meal deactivated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
