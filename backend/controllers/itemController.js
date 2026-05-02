const { db } = require('../config/db');
const { logAction } = require('../utils/logger');
const { buildIdOrUuidWhere, generateUuid } = require('../utils/identifier');

// @desc    Get all items
// @route   GET /api/items
// @access  Private
exports.getItems = async (req, res) => {
    const { 
        search, category, main_category, is_popular, portion_type, 
        availability_status, include_inactive, is_quick_retail, is_restaurant_item 
    } = req.query;
    
    try {
        let query = 'SELECT * FROM items WHERE 1=1';
        let params = [];

        if (include_inactive !== 'true') {
            query += ' AND status = "active"';
        }

        if (is_quick_retail === 'true' || is_quick_retail === '1') {
            query += ' AND is_quick_retail = 1';
        }

        if (is_restaurant_item === 'true' || is_restaurant_item === '1') {
            query += ' AND is_restaurant_item = 1';
        }

        if (search) {
            query += ' AND (name LIKE ? OR short_code LIKE ? OR category LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        if (main_category) {
            query += ' AND main_category = ?';
            params.push(main_category);
        }

        if (is_popular === 'true') {
            query += ' AND is_popular = 1';
        }

        if (portion_type) {
            query += ' AND portion_type = ?';
            params.push(portion_type);
        }

        if (availability_status) {
            query += ' AND availability_status = ?';
            params.push(availability_status);
        }

        query += ' ORDER BY display_order ASC, category ASC, name ASC';

        const [items] = await db.query(query, params);
        res.json({ success: true, data: items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get distinct categories and main categories
// @route   GET /api/items/categories
// @access  Private
exports.getCategories = async (req, res) => {
    try {
        const [categories] = await db.query('SELECT DISTINCT category FROM items WHERE status = "active" ORDER BY category ASC');
        const [mainCategories] = await db.query('SELECT DISTINCT main_category FROM items WHERE status = "active" AND main_category IS NOT NULL ORDER BY main_category ASC');
        
        res.json({ 
            success: true, 
            data: {
                categories: categories.map(c => c.category),
                main_categories: mainCategories.map(c => c.main_category)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create new item
// @route   POST /api/items
// @access  Private/Admin/Manager
exports.createItem = async (req, res) => {
    const { 
        name, short_code, category, main_category, portion_type, price, 
        portion_label, description, track_stock, stock_qty, low_stock_threshold,
        is_popular, display_order,
        send_to_kitchen, item_type, quick_sale_enabled, age_restricted, requires_age_confirmation, barcode, unit_type,
        no_receipt_default, show_in_quick_bar, purchase_unit_type, units_per_purchase_unit,
        is_quick_retail, is_restaurant_item, pack_size
    } = req.body;

    try {
        const uuid = generateUuid();
        const [result] = await db.query(
            `INSERT INTO items (
                uuid, name, short_code, category, main_category, portion_type, price, 
                portion_label, description, track_stock, stock_qty, low_stock_threshold, 
                is_popular, display_order, status, availability_status,
                send_to_kitchen, item_type, quick_sale_enabled, age_restricted, requires_age_confirmation, barcode, unit_type,
                no_receipt_default, show_in_quick_bar, purchase_unit_type, units_per_purchase_unit,
                is_quick_retail, is_restaurant_item, pack_size
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'available', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                uuid, name, short_code || null, category, main_category || null, portion_type || 'regular', 
                parseFloat(price), portion_label, description, track_stock ? 1 : 0, 
                parseFloat(stock_qty) || 0, parseFloat(low_stock_threshold) || 0,
                is_popular ? 1 : 0, parseInt(display_order) || 0,
                send_to_kitchen !== undefined ? (send_to_kitchen === true || send_to_kitchen === 1 || send_to_kitchen === 'true') : true, 
                item_type || 'food', 
                quick_sale_enabled ? 1 : 0, 
                age_restricted ? 1 : 0, 
                requires_age_confirmation ? 1 : 0, 
                barcode || null, 
                unit_type || 'item',
                no_receipt_default ? 1 : 0,
                show_in_quick_bar ? 1 : 0,
                purchase_unit_type || 'item',
                parseInt(units_per_purchase_unit) || 1,
                is_quick_retail ? 1 : 0,
                is_restaurant_item !== undefined ? (is_restaurant_item ? 1 : 0) : 1,
                parseInt(pack_size) || parseInt(units_per_purchase_unit) || 20
            ]
        );
        
        const itemId = result.insertId;
        await logAction(req.user.id, 'item_created', 'item', itemId, null, { ...req.body, uuid });

        const [newItem] = await db.query('SELECT * FROM items WHERE id = ?', [itemId]);
        res.status(201).json({ success: true, data: newItem[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update item
// @route   PUT /api/items/:id
// @access  Private/Admin/Manager
exports.updateItem = async (req, res) => {
    const { 
        name, short_code, category, main_category, portion_type, price, 
        portion_label, description, track_stock, stock_qty, low_stock_threshold, 
        status, availability_status, is_popular, display_order,
        send_to_kitchen, item_type, quick_sale_enabled, age_restricted, requires_age_confirmation, barcode, unit_type,
        no_receipt_default, show_in_quick_bar, purchase_unit_type, units_per_purchase_unit,
        is_quick_retail, is_restaurant_item, pack_size
    } = req.body;

    try {
        const where = buildIdOrUuidWhere(null, req.params.id);
        const [oldItem] = await db.query(`SELECT * FROM items WHERE ${where.query}`, [where.value]);
        if (oldItem.length === 0) return res.status(404).json({ success: false, message: 'Item not found' });
        const itemId = oldItem[0].id;

        await db.query(
            `UPDATE items SET 
                name = ?, short_code = ?, category = ?, main_category = ?, portion_type = ?, price = ?, 
                portion_label = ?, description = ?, track_stock = ?, stock_qty = ?, low_stock_threshold = ?, 
                status = ?, availability_status = ?, is_popular = ?, display_order = ?,
                send_to_kitchen = ?, item_type = ?, quick_sale_enabled = ?, age_restricted = ?, 
                requires_age_confirmation = ?, barcode = ?, unit_type = ?,
                no_receipt_default = ?, show_in_quick_bar = ?,
                purchase_unit_type = ?, units_per_purchase_unit = ?,
                is_quick_retail = ?, is_restaurant_item = ?, pack_size = ?
             WHERE id = ?`,
            [
                name, short_code || null, category, main_category || null, portion_type || 'regular', 
                parseFloat(price), portion_label, description, track_stock ? 1 : 0, 
                parseFloat(stock_qty), parseFloat(low_stock_threshold), 
                status, availability_status, is_popular ? 1 : 0, parseInt(display_order) || 0,
                send_to_kitchen !== undefined ? (send_to_kitchen === true || send_to_kitchen === 1 || send_to_kitchen === 'true') : true, 
                item_type || 'food', 
                quick_sale_enabled ? 1 : 0, 
                age_restricted ? 1 : 0, 
                requires_age_confirmation ? 1 : 0, 
                barcode || null, 
                unit_type || 'item',
                no_receipt_default ? 1 : 0,
                show_in_quick_bar ? 1 : 0,
                purchase_unit_type || 'item',
                parseInt(units_per_purchase_unit) || 1,
                is_quick_retail ? 1 : 0,
                is_restaurant_item !== undefined ? (is_restaurant_item ? 1 : 0) : 1,
                parseInt(pack_size) || parseInt(units_per_purchase_unit) || 20,
                itemId
            ]
        );
        
        await logAction(req.user.id, 'item_updated', 'item', itemId, oldItem[0], req.body);

        const [updatedItem] = await db.query('SELECT * FROM items WHERE id = ?', [itemId]);
        res.json({ success: true, message: 'Item updated successfully', data: updatedItem[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update item price
// @route   PATCH /api/items/:id/price
// @access  Private/Admin/Manager
exports.updatePrice = async (req, res) => {
    const { price } = req.body;
    try {
        const where = buildIdOrUuidWhere(null, req.params.id);
        const [oldItem] = await db.query(`SELECT id, price FROM items WHERE ${where.query}`, [where.value]);
        if (oldItem.length === 0) return res.status(404).json({ success: false, message: 'Item not found' });
        const itemId = oldItem[0].id;

        await db.query('UPDATE items SET price = ? WHERE id = ?', [parseFloat(price), itemId]);
        
        await logAction(req.user.id, 'item_price_changed', 'item', itemId, { price: oldItem[0].price }, { price: parseFloat(price) });

        res.json({ success: true, message: 'Price updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update item availability
// @route   PATCH /api/items/:id/availability
// @access  Private/Admin/Manager/Kitchen
exports.updateAvailability = async (req, res) => {
    const { availability_status, reason } = req.body;
    try {
        const where = buildIdOrUuidWhere(null, req.params.id);
        const [oldItem] = await db.query(`SELECT id, availability_status FROM items WHERE ${where.query}`, [where.value]);
        if (oldItem.length === 0) return res.status(404).json({ success: false, message: 'Item not found' });
        const itemId = oldItem[0].id;

        await db.query('UPDATE items SET availability_status = ? WHERE id = ?', [availability_status, itemId]);
        
        await logAction(req.user.id, 'item_availability_changed', 'item', itemId, 
            { status: oldItem[0].availability_status }, 
            { status: availability_status, reason }
        );

        res.json({ success: true, message: `Item marked as ${availability_status.replace('_', ' ')}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update item status (Active/Inactive)
// @route   PATCH /api/items/:id/status
// @access  Private/Admin/Manager
exports.updateStatus = async (req, res) => {
    const { status } = req.body;
    try {
        const where = buildIdOrUuidWhere(null, req.params.id);
        const [oldItem] = await db.query(`SELECT id, status FROM items WHERE ${where.query}`, [where.value]);
        if (oldItem.length === 0) return res.status(404).json({ success: false, message: 'Item not found' });
        const itemId = oldItem[0].id;

        await db.query('UPDATE items SET status = ? WHERE id = ?', [status, itemId]);
        
        const action = status === 'active' ? 'item_reactivated' : 'item_deactivated';
        await logAction(req.user.id, action, 'item', itemId, { status: oldItem[0].status }, { status });

        res.json({ success: true, message: `Item ${status === 'active' ? 'reactivated' : 'deactivated'}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update item usability fields
// @route   PATCH /api/items/:id/usability
// @access  Private/Admin/Manager
exports.updateUsability = async (req, res) => {
    const { is_popular, short_code, display_order } = req.body;
    try {
        const where = buildIdOrUuidWhere(null, req.params.id);
        const [oldItem] = await db.query(`SELECT * FROM items WHERE ${where.query}`, [where.value]);
        if (oldItem.length === 0) return res.status(404).json({ success: false, message: 'Item not found' });
        const itemId = oldItem[0].id;

        const updates = [];
        const params = [];
        if (is_popular !== undefined) { updates.push('is_popular = ?'); params.push(is_popular ? 1 : 0); }
        if (short_code !== undefined) { updates.push('short_code = ?'); params.push(short_code); }
        if (display_order !== undefined) { updates.push('display_order = ?'); params.push(display_order); }

        if (updates.length > 0) {
            await db.query(`UPDATE items SET ${updates.join(', ')} WHERE id = ?`, [...params, itemId]);
            await logAction(req.user.id, 'item_usability_updated', 'item', itemId, oldItem[0], req.body);
        }

        res.json({ success: true, message: 'Usability fields updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Soft delete item
// @route   DELETE /api/items/:id
// @access  Private/Admin
exports.deleteItem = async (req, res) => {
    try {
        const where = buildIdOrUuidWhere(null, req.params.id);
        const [oldItem] = await db.query(`SELECT id FROM items WHERE ${where.query}`, [where.value]);
        if (oldItem.length === 0) return res.status(404).json({ success: false, message: 'Item not found' });
        const itemId = oldItem[0].id;

        const [result] = await db.query('UPDATE items SET status = "inactive" WHERE id = ?', [itemId]);
        
        await logAction(req.user.id, 'item_deactivated', 'item', itemId, null, { status: 'inactive', method: 'soft_delete' });
        
        res.json({ success: true, message: 'Item deactivated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Receive retail stock with pack-to-stick conversion
// @route   POST /api/items/:id/receive-stock
// @access  Private/Admin/Manager
exports.receiveStock = async (req, res) => {
    const { 
        purchase_unit_type, 
        purchase_unit_qty, 
        units_per_purchase_unit, 
        cost_per_purchase_unit, 
        note 
    } = req.body;
    const itemId = req.params.id;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const where = buildIdOrUuidWhere(null, req.params.id);
        // 1. Fetch item to verify it exists
        const [items] = await connection.query(`SELECT * FROM items WHERE ${where.query}`, [where.value]);
        if (items.length === 0) {
            connection.release();
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        const item = items[0];
        const itemId = item.id;

        // 2. Calculate total units added using pack_size or units_per_purchase_unit
        const conversionFactor = parseInt(units_per_purchase_unit) || parseInt(item.pack_size) || parseInt(item.units_per_purchase_unit) || 1;
        const totalUnitsAdded = parseFloat(purchase_unit_qty) * conversionFactor;

        // 3. Record the receipt
        await connection.query(
            `INSERT INTO retail_stock_receipts (
                item_id, purchase_unit_type, purchase_unit_qty, units_per_purchase_unit, 
                total_units_added, cost_per_purchase_unit, note, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                itemId, purchase_unit_type, parseFloat(purchase_unit_qty), conversionFactor,
                totalUnitsAdded, cost_per_purchase_unit ? parseFloat(cost_per_purchase_unit) : null,
                note || null, req.user.id
            ]
        );

        // 4. Update item stock
        await connection.query(
            'UPDATE items SET stock_qty = stock_qty + ?, track_stock = 1 WHERE id = ?',
            [totalUnitsAdded, itemId]
        );

        await connection.commit();
        await logAction(req.user.id, 'stock_received', 'item', itemId, { old_stock: item.stock_qty }, { added: totalUnitsAdded, new_stock: parseFloat(item.stock_qty) + totalUnitsAdded });

        res.json({ success: true, message: `Successfully added ${totalUnitsAdded} units to stock.`, new_stock: parseFloat(item.stock_qty) + totalUnitsAdded });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    } finally {
        connection.release();
    }
};
