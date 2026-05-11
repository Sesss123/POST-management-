/**
 * Shared settings utilities for backend controllers
 */
const getSystemSettings = async (connection, shopId) => {
    const [rows] = await connection.query('SELECT * FROM settings WHERE shop_id = ?', [shopId]);
    return rows.reduce((acc, s) => {
        acc[s.setting_key] = s.setting_value;
        return acc;
    }, {});
};

module.exports = { getSystemSettings };
