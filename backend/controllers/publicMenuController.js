const { db } = require('../config/db');
const cache = require('../utils/cache');

// @desc    Get public menu items for a specific shop
// @route   GET /api/public-menu/:shopIdentifier/items
// @access  Public
exports.getPublicItems = async (req, res) => {
    const { shopIdentifier } = req.params;
    const { search, category, main_category, featured } = req.query;

    try {
        // Resolve shop by identifier
        let shop;
        if (shopIdentifier === 'default') {
            // Fallback for legacy/development URLs: Pick the first active shop
            const [shops] = await db.query('SELECT id FROM shops WHERE status = "active" LIMIT 1');
            shop = shops[0];
        } else {
            const [shops] = await db.query('SELECT id FROM shops WHERE identifier = ? AND status = "active"', [shopIdentifier]);
            shop = shops[0];
        }

        if (!shop) {
            return res.status(404).json({ success: false, message: 'Shop not found or is inactive.' });
        }
        const shopId = shop.id;

        const cacheKey = `publicMenu:${shopId}:${search || ''}:${category || ''}:${main_category || ''}:${featured || ''}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }

        let query = `
            SELECT 
                uuid, name, category, main_category, price, portion_label, 
                public_description, image_url, spice_level, is_veg, is_featured, 
                availability_status, public_display_order
            FROM items 
            WHERE status = 'active' AND show_on_public_menu = true AND shop_id = ?
        `;
        let params = [shopId];

        if (search) {
            query += ' AND (name LIKE ? OR category LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        if (main_category) {
            query += ' AND main_category = ?';
            params.push(main_category);
        }

        if (featured === 'true') {
            query += ' AND is_featured = true';
        }

        query += ' ORDER BY public_display_order ASC, category ASC, name ASC';

        const [items] = await db.query(query, params);
        
        const responseData = { success: true, data: items };
        // Cache for 60 seconds
        cache.set(cacheKey, responseData, 60);

        res.json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get menu by shop identifier + table number
// @route   GET /api/public-menu/:shopIdentifier/table/:tableNo
// @access  Public
exports.getMenuByTable = async (req, res) => {
    const { shopIdentifier, tableNo } = req.params;

    try {
        // 1. Resolve shop
        let shop;
        if (shopIdentifier === 'default') {
            const [shops] = await db.query('SELECT id, name FROM shops WHERE status = "active" LIMIT 1');
            shop = shops[0];
        } else {
            const [shops] = await db.query('SELECT id, name FROM shops WHERE identifier = ? AND status = "active"', [shopIdentifier]);
            shop = shops[0];
        }

        if (!shop) {
            return res.status(404).json({ success: false, message: 'Shop not found or is inactive.' });
        }
        const shopId = shop.id;
        const shopName = shop.name;

        const cacheKey = `publicMenuTable:${shopId}:${tableNo}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }

        // 2. Fetch shop-specific settings
        const [settingsArr] = await db.query('SELECT setting_key, setting_value FROM settings WHERE shop_id = ?', [shopId]);
        const settings = {};
        settingsArr.forEach(s => settings[s.setting_key] = s.setting_value);

        // Check if public menu is enabled for this shop
        if (settings['public_menu_enabled'] === '0' || settings['public_menu_enabled'] === 'false') {
            return res.status(403).json({ success: false, message: 'Public Digital Menu is currently disabled by this restaurant.' });
        }

        const restaurantInfo = {
            id: shopId, // Added to identify the shop room for real-time customer alerts
            name: settings['restaurant_name'] || shopName,
            address: settings['restaurant_address'] || '',
            phone: settings['restaurant_phone'] || '',
            footer_message: settings['public_menu_footer_message'] || 'Thank you for visiting us!',
            show_prices: settings['public_menu_show_prices'] !== '0' && settings['public_menu_show_prices'] !== 'false',
            show_images: settings['public_menu_show_images'] !== '0' && settings['public_menu_show_images'] !== 'false'
        };

        // 3. Verify table exists for this shop
        const [tables] = await db.query('SELECT table_no FROM restaurant_tables WHERE table_no = ? AND shop_id = ?', [tableNo, shopId]);
        const table = tables.length > 0 ? { table_no: tables[0].table_no } : { table_no: tableNo };

        // 4. Fetch items for this shop
        let itemQuery = `
            SELECT 
                uuid, name, category, main_category, price, portion_label, 
                public_description, image_url, spice_level, is_veg, is_featured, 
                availability_status, public_display_order
            FROM items 
            WHERE status = 'active' AND show_on_public_menu = true AND shop_id = ?
        `;
        let itemParams = [shopId];

        if (settings['public_menu_show_sold_out_items'] === '0' || settings['public_menu_show_sold_out_items'] === 'false') {
            itemQuery += " AND availability_status = 'available'";
        }

        itemQuery += ' ORDER BY public_display_order ASC, category ASC, name ASC';

        const [items] = await db.query(itemQuery, itemParams);

        // 5. Get categories
        const categories = [...new Set(items.map(item => item.category))];

        const responseData = {
            success: true,
            data: {
                restaurant: restaurantInfo,
                table: table,
                categories: categories,
                items: items,
                settings: {
                    show_prices: restaurantInfo.show_prices,
                    show_images: restaurantInfo.show_images
                }
            }
        };

        // Cache for 60 seconds
        cache.set(cacheKey, responseData, 60);

        res.json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get public receipt by UUID
// @route   GET /api/public-menu/receipt/:uuid
// @access  Public
exports.getPublicReceipt = async (req, res) => {
    const { uuid } = req.params;

    try {
        const [invoices] = await db.query(
            `SELECT i.*, c.name as customer_name, t.table_no
             FROM invoices i
             LEFT JOIN customers c ON i.customer_id = c.id
             LEFT JOIN restaurant_tables t ON i.table_id = t.id
             WHERE i.uuid = ?`,
            [uuid]
        );

        if (invoices.length === 0) {
            return res.status(404).json({ success: false, message: 'Receipt not found.' });
        }

        const invoice = invoices[0];

        // Fetch items
        const [items] = await db.query(
            'SELECT * FROM invoice_items WHERE invoice_id = ? AND shop_id = ?',
            [invoice.id, invoice.shop_id]
        );

        // Fetch modifiers for each item
        for (let item of items) {
            const [mods] = await db.query(
                'SELECT modifier_name as name, modifier_type as type, price_delta FROM invoice_item_modifiers WHERE invoice_item_id = ? AND shop_id = ?',
                [item.id, invoice.shop_id]
            );
            item.modifiers = mods;
        }

        invoice.items = items;

        // Mask sensitive data if needed, but for now we'll send it as requested
        // The prompt said "show only receipt-safe data"
        // We'll remove created_by and shop_id for purity
        delete invoice.created_by;
        delete invoice.shop_id;

        res.json({ success: true, data: invoice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
