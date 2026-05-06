const { db } = require('../config/db');
const smsService = require('../services/smsService');
const { generateUuid } = require('../utils/identifier');

// @desc    Get all campaigns
// @route   GET /api/marketing/campaigns
exports.getCampaigns = async (req, res) => {
    try {
        const [campaigns] = await db.query(
            'SELECT * FROM sms_campaigns WHERE shop_id = ? ORDER BY created_at DESC',
            [req.shopId]
        );
        res.json({ success: true, data: campaigns });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create and send a campaign
// @route   POST /api/marketing/campaigns
exports.createCampaign = async (req, res) => {
    const { name, message, targetGroup } = req.body;

    if (!name || !message || !targetGroup) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Identify recipients
        let query = 'SELECT phone, name FROM customers WHERE shop_id = ? AND phone IS NOT NULL AND phone != ""';
        const params = [req.shopId];

        if (targetGroup === 'debtors') {
            query += ' AND balance > 0';
        } else if (targetGroup === 'loyalty_members') {
            query += ' AND loyalty_enabled = 1';
        }

        const [recipients] = await connection.query(query, params);

        if (recipients.length === 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'No recipients found for the selected group' });
        }

        // 2. Save campaign as 'sending'
        const campaignUuid = generateUuid();
        const [campResult] = await connection.query(
            'INSERT INTO sms_campaigns (uuid, shop_id, name, message, target_group, status, total_recipients, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [campaignUuid, req.shopId, name, message, targetGroup, 'sending', recipients.length, req.user.id]
        );
        const campaignId = campResult.insertId;

        await connection.commit(); // Commit the 'sending' state

        // 3. Trigger async sending (simulated here)
        // In production, this should be a background job (worker)
        res.json({ 
            success: true, 
            message: `Campaign initiated for ${recipients.length} recipients`,
            data: { id: campaignId, uuid: campaignUuid }
        });

        // Background sending logic
        let successCount = 0;
        let failCount = 0;

        for (const r of recipients) {
            const result = await smsService.sendSMS({
                shopId: req.shopId,
                phone: r.phone,
                message: message.replace('{name}', r.name),
                type: 'campaign',
                campaignId
            });

            if (result.success) successCount++;
            else failCount++;
        }

        // Update campaign final status
        await db.query(
            'UPDATE sms_campaigns SET status = "completed", successful_sends = ?, failed_sends = ? WHERE id = ?',
            [successCount, failCount, campaignId]
        );

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create campaign' });
    } finally {
        connection.release();
    }
};

// @desc    Get campaign logs
// @route   GET /api/marketing/campaigns/:id/logs
exports.getCampaignLogs = async (req, res) => {
    try {
        const [logs] = await db.query(
            'SELECT * FROM sms_logs WHERE campaign_id = ? AND shop_id = ? ORDER BY created_at DESC',
            [req.params.id, req.shopId]
        );
        res.json({ success: true, data: logs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
