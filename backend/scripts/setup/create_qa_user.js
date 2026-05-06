const { db } = require('./config/db');
const bcrypt = require('bcryptjs');

async function createUser() {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);
    
    try {
        await db.query('DELETE FROM users WHERE email = "qa@test.com"');
        await db.query(
            'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
            ['QA Admin', 'qa@test.com', hashedPassword, 'admin', 'active']
        );
        console.log('QA user created: qa@test.com / 123456');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

createUser();
