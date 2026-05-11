const { db } = require('./config/db');
const bcrypt = require('bcryptjs');

async function seedSuperAdmin() {
    try {
        const [existing] = await db.query('SELECT id FROM users WHERE role = "super_admin"');
        if (existing.length > 0) {
            console.log('Super admin already exists.');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('superadmin123', salt);

        await db.query(
            'INSERT INTO users (name, email, password, role, status, shop_id) VALUES (?, ?, ?, ?, ?, ?)',
            ['Platform Owner', 'superadmin@restopos.com', hashedPassword, 'super_admin', 'active', null]
        );

        console.log('Super admin seeded successfully: superadmin@restopos.com / superadmin123');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding super admin:', error);
        process.exit(1);
    }
}

seedSuperAdmin();
