const { db } = require('../../config/db');
const bcrypt = require('bcryptjs');

async function seedSuperAdmin() {
    try {
        console.log('Checking for existing super admin...');
        const [rows] = await db.query('SELECT id, email FROM users WHERE role = "super_admin"');
        
        if (rows && rows.length > 0) {
            console.log(`Super admin already exists: ${rows[0].email}`);
            process.exit(0);
        }

        console.log('Creating new super admin user...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('superadmin123', salt);

        await db.query(
            'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
            ['Platform Owner', 'superadmin@restopos.com', hashedPassword, 'super_admin', 'active']
        );

        console.log('✔ Super admin seeded successfully!');
        console.log('Credentials: superadmin@restopos.com / superadmin123');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding super admin:', error);
        process.exit(1);
    }
}

seedSuperAdmin();
