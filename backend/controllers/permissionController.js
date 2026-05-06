const { db } = require('../config/db');

// @desc    Get all available permissions
// @route   GET /api/permissions
// @access  Private/Admin
exports.getAllPermissions = async (req, res) => {
    try {
        const [perms] = await db.query('SELECT * FROM permissions ORDER BY category, name');
        res.json({ success: true, data: perms });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get role permissions for a shop
// @route   GET /api/permissions/roles
// @access  Private/Admin
exports.getRolePermissions = async (req, res) => {
    try {
        const [rolePerms] = await db.query(`
            SELECT rp.role, p.perm_key 
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            WHERE rp.shop_id = ?
        `, [req.shopId]);

        // Group by role
        const grouped = rolePerms.reduce((acc, rp) => {
            if (!acc[rp.role]) acc[rp.role] = [];
            acc[rp.role].push(rp.perm_key);
            return acc;
        }, {});

        res.json({ success: true, data: grouped });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update role permissions
// @route   POST /api/permissions/roles
// @access  Private/Admin
exports.updateRolePermissions = async (req, res) => {
    const { role, permissionKeys } = req.body; // role: 'cashier', permissionKeys: ['pos.cash_sale', ...]
    
    if (!role || !Array.isArray(permissionKeys)) {
        return res.status(400).json({ success: false, message: 'Invalid data provided' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Delete existing for this role/shop
        await connection.query('DELETE FROM role_permissions WHERE shop_id = ? AND role = ?', [req.shopId, role]);

        // 2. Insert new ones
        if (permissionKeys.length > 0) {
            const [perms] = await connection.query('SELECT id FROM permissions WHERE perm_key IN (?)', [permissionKeys]);
            for (const p of perms) {
                await connection.query(
                    'INSERT INTO role_permissions (shop_id, role, permission_id) VALUES (?, ?, ?)',
                    [req.shopId, role, p.id]
                );
            }
        }

        await connection.commit();
        res.json({ success: true, message: `Permissions updated for ${role}` });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update role permissions' });
    } finally {
        connection.release();
    }
};

// @desc    Get user permission overrides
// @route   GET /api/permissions/users/:userId
// @access  Private/Admin
exports.getUserOverrides = async (req, res) => {
    try {
        const [overrides] = await db.query(`
            SELECT p.perm_key, up.value 
            FROM user_permissions up
            JOIN permissions p ON up.permission_id = p.id
            WHERE up.user_id = ? AND up.shop_id = ?
        `, [req.params.userId, req.shopId]);

        res.json({ success: true, data: overrides });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update user permission overrides
// @route   POST /api/permissions/users/:userId
// @access  Private/Admin
exports.updateUserOverrides = async (req, res) => {
    const { overrides } = req.body; // { 'invoice.cancel': true, 'naya.view': false }
    const userId = req.params.userId;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        for (const [key, value] of Object.entries(overrides)) {
            const [[perm]] = await connection.query('SELECT id FROM permissions WHERE perm_key = ?', [key]);
            if (perm) {
                // Upsert logic
                const [[existing]] = await connection.query(
                    'SELECT id FROM user_permissions WHERE shop_id = ? AND user_id = ? AND permission_id = ?',
                    [req.shopId, userId, perm.id]
                );

                if (existing) {
                    await connection.query(
                        'UPDATE user_permissions SET value = ? WHERE id = ?',
                        [value, existing.id]
                    );
                } else {
                    await connection.query(
                        'INSERT INTO user_permissions (shop_id, user_id, permission_id, value) VALUES (?, ?, ?, ?)',
                        [req.shopId, userId, perm.id, value]
                    );
                }
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'User overrides updated' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update overrides' });
    } finally {
        connection.release();
    }
};
