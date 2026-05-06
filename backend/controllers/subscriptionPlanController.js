const { db } = require('../config/db');
const { logAction } = require('../utils/logger');

// @desc    Get all subscription plans
// @route   GET /api/super-admin/plans
// @access  Private/SuperAdmin
exports.getPlans = async (req, res) => {
    try {
        const [plans] = await db.query('SELECT * FROM subscription_plans ORDER BY price ASC');
        res.json({ success: true, data: plans });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create a new plan
// @route   POST /api/super-admin/plans
// @access  Private/SuperAdmin
exports.createPlan = async (req, res) => {
    const { name, price, billing_interval, features, is_active } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO subscription_plans (name, price, billing_interval, features, is_active) VALUES (?, ?, ?, ?, ?)',
            [name, price, billing_interval || 'monthly', JSON.stringify(features || []), is_active !== false]
        );
        
        await logAction(req.user.id, 'plan_created', 'subscription_plan', result.insertId, null, req.body);
        
        res.status(201).json({ 
            success: true, 
            message: 'Subscription plan created', 
            data: { id: result.insertId } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update a plan
// @route   PUT /api/super-admin/plans/:id
// @access  Private/SuperAdmin
exports.updatePlan = async (req, res) => {
    const { name, price, billing_interval, features, is_active } = req.body;
    try {
        await db.query(
            'UPDATE subscription_plans SET name = ?, price = ?, billing_interval = ?, features = ?, is_active = ? WHERE id = ?',
            [name, price, billing_interval, JSON.stringify(features), is_active, req.params.id]
        );
        
        await logAction(req.user.id, 'plan_updated', 'subscription_plan', req.params.id, null, req.body);
        
        res.json({ success: true, message: 'Subscription plan updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete a plan
// @route   DELETE /api/super-admin/plans/:id
// @access  Private/SuperAdmin
exports.deletePlan = async (req, res) => {
    try {
        // Check if any shop is using this plan (simplified check by name for now)
        const [plan] = await db.query('SELECT name FROM subscription_plans WHERE id = ?', [req.params.id]);
        if (plan.length === 0) return res.status(404).json({ success: false, message: 'Plan not found' });
        
        const [shops] = await db.query('SELECT id FROM shops WHERE subscription_plan = ?', [plan[0].name]);
        if (shops.length > 0) {
            return res.status(400).json({ success: false, message: 'Cannot delete plan because it is being used by shops' });
        }

        await db.query('DELETE FROM subscription_plans WHERE id = ?', [req.params.id]);
        await logAction(req.user.id, 'plan_deleted', 'subscription_plan', req.params.id, null, { name: plan[0].name });
        
        res.json({ success: true, message: 'Subscription plan deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
