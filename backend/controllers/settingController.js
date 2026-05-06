const { db } = require('../config/db');
const { logAction } = require('../utils/logger');
const cache = require('../utils/cache');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private
exports.getSettings = async (req, res) => {
    try {
        const cacheKey = `settings:${req.shopId}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }

        const [settings] = await db.query('SELECT * FROM settings WHERE shop_id = ? ORDER BY group_name, setting_key', [req.shopId]);
        
        // Group settings by group_name for easier consumption in frontend
        const groupedSettings = settings.reduce((acc, s) => {
            if (!acc[s.group_name]) acc[s.group_name] = {};
            acc[s.group_name][s.setting_key] = {
                value: s.setting_type === 'boolean' ? s.setting_value === 'true' : 
                       s.setting_type === 'number' ? parseFloat(s.setting_value) : s.setting_value,
                type: s.setting_type,
                label: s.label || s.setting_key.split('_').join(' '),
                description: s.description,
                options: s.options ? s.options.split(',') : []
            };
            return acc;
        }, {});

        // Also provide a flat key-value object for quick lookups in backend
        const flatSettings = settings.reduce((acc, s) => {
            let val = s.setting_value;
            if (s.setting_type === 'number') val = parseFloat(val);
            if (s.setting_type === 'boolean') val = val === 'true';
            acc[s.setting_key] = val;
            return acc;
        }, {});

        const responseData = { 
            success: true, 
            data: groupedSettings,
            flat: flatSettings 
        };

        // Cache for 60 seconds
        cache.set(cacheKey, responseData, 60);

        res.json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get settings by group
// @route   GET /api/settings/group/:groupName
// @access  Private
exports.getSettingsByGroup = async (req, res) => {
    try {
        const [settings] = await db.query('SELECT * FROM settings WHERE group_name = ? AND shop_id = ?', [req.params.groupName, req.shopId]);
        res.json({ success: true, data: settings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update multiple settings
// @route   PUT /api/settings
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
    const { group_name, settings } = req.body; // { group_name: 'stock_menu', settings: { key: value, ... } }
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        for (const [key, value] of Object.entries(settings)) {
            // Get old value for audit log
            const [oldVal] = await connection.query('SELECT setting_value FROM settings WHERE setting_key = ? AND shop_id = ?', [key, req.shopId]);
            
            if (oldVal.length > 0) {
                const newValue = String(value);
                await connection.query(
                    'UPDATE settings SET setting_value = ?, updated_by = ? WHERE setting_key = ? AND shop_id = ?',
                    [newValue, req.user.id, key, req.shopId]
                );

                if (oldVal[0].setting_value !== newValue) {
                    await logAction(
                        req.user.id,
                        'settings_updated',
                        'settings',
                        null,
                        { [key]: oldVal[0].setting_value },
                        { [key]: newValue }
                    );
                }
            }
        }

        await connection.commit();
        
        // Invalidate cache
        cache.del(`settings:${req.shopId}`);

        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Failed to update settings' });
    } finally {
        connection.release();
    }
};

// @desc    Update single setting
// @route   PATCH /api/settings/:key
// @access  Private/Admin
exports.updateSettingByKey = async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;

    try {
        const [oldVal] = await db.query('SELECT setting_value FROM settings WHERE setting_key = ? AND shop_id = ?', [key, req.shopId]);
        if (oldVal.length === 0) {
            return res.status(404).json({ success: false, message: 'Setting not found' });
        }

        const newValue = String(value);
        await db.query(
            'UPDATE settings SET setting_value = ?, updated_by = ? WHERE setting_key = ? AND shop_id = ?',
            [newValue, req.user.id, key, req.shopId]
        );

        if (oldVal[0].setting_value !== newValue) {
            await logAction(
                req.user.id,
                'settings_updated',
                'settings',
                null,
                { [key]: oldVal[0].setting_value },
                { [key]: newValue }
            );
        }

        // Invalidate cache
        cache.del(`settings:${req.shopId}`);

        res.json({ success: true, message: 'Setting updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
