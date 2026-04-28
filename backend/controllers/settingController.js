const { db } = require('../config/db');
const { logAction } = require('../utils/logger');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private
exports.getSettings = async (req, res) => {
    try {
        const [settings] = await db.query('SELECT * FROM settings');
        // Convert array of {setting_key, setting_value} to an object
        const settingsObj = settings.reduce((acc, s) => {
            acc[s.setting_key] = s.setting_value;
            return acc;
        }, {});
        res.json({ success: true, data: settingsObj });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update settings
// @route   POST /api/settings
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
    const settings = req.body; // { setting_key: setting_value, ... }
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [oldSettings] = await connection.query('SELECT * FROM settings');
        const oldSettingsObj = oldSettings.reduce((acc, s) => {
            acc[s.setting_key] = s.setting_value;
            return acc;
        }, {});

        for (const [key, value] of Object.entries(settings)) {
            await connection.query(
                'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                [key, String(value), String(value)]
            );
        }

        await logAction(
            req.user.id,
            'settings_updated',
            'settings',
            null,
            oldSettingsObj,
            settings
        );

        await connection.commit();
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update settings' });
    } finally {
        connection.release();
    }
};
