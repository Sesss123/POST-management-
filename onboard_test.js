const { db } = require('./backend/config/db');
const bcrypt = require('bcryptjs');
const { generateUuid } = require('./backend/utils/identifier');

async function testOnboarding() {
    console.log('Starting automated onboarding test...');
    
    const timestamp = Date.now();
    const shopData = {
        name: "Elite Grill House",
        identifier: `elite-grill-${timestamp}`,
        admin_name: "Nuwan Bandara",
        admin_email: `nuwan.${timestamp}@elitegrill.com`,
        admin_password: "password123"
    };

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        console.log(`Checking identifier availability: ${shopData.identifier}...`);
        const [[slugCheck]] = await connection.query('SELECT id FROM shops WHERE identifier = ? OR slug = ? LIMIT 1', [shopData.identifier, shopData.identifier]);
        if (slugCheck) {
            throw new Error('Identifier already exists');
        }

        console.log('Provisioning shop instance...');
        const shopUuid = generateUuid();
        const [shopResult] = await connection.query(
            `INSERT INTO shops 
             (uuid, name, identifier, slug, status, subscription_status, subscription_plan, trial_ends_at) 
             VALUES (?, ?, ?, ?, 'active', 'trial', 'standard', DATE_ADD(CURDATE(), INTERVAL 14 DAY))`,
            [shopUuid, shopData.name, shopData.identifier, shopData.identifier]
        );
        const shopId = shopResult.insertId;

        console.log(`Creating root administrator: ${shopData.admin_email}...`);
        const hashedPassword = await bcrypt.hash(shopData.admin_password, 10);
        const userUuid = generateUuid();
        await connection.query(
            `INSERT INTO users (uuid, shop_id, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, 'admin', 'active')`,
            [userUuid, shopId, shopData.admin_name, shopData.admin_email, hashedPassword]
        );

        await connection.commit();
        console.log('\n✔ ONBOARDING SUCCESSFUL!');
        console.log('-----------------------------------');
        console.log('Shop Name     :', shopData.name);
        console.log('Shop ID       :', shopId);
        console.log('Slug URL      :', `restoledger.app/${shopData.identifier}`);
        console.log('Admin Account :', shopData.admin_email);
        console.log('Status        : ACTIVE (Trial Mode)');
        console.log('-----------------------------------');
    } catch (error) {
        await connection.rollback();
        console.error('❌ Onboarding Failed:', error.message);
    } finally {
        connection.release();
        process.exit(0);
    }
}

testOnboarding();
