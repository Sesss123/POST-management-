const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: fs.existsSync('.env') ? '.env' : '../.env' });

async function createKitchenUser() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const name = 'Kitchen Staff';
        const email = 'kitchen@resto.com';
        const password = 'kitchen123';
        const role = 'kitchen';

        // Check if user exists
        const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
        
        if (existing.length > 0) {
            console.log(`User ${email} already exists.`);
            
            // Optionally update password to ensure it's known
            const hashedPassword = await bcrypt.hash(password, 10);
            await connection.execute('UPDATE users SET password = ?, role = ? WHERE email = ?', [hashedPassword, role, email]);
            console.log(`Updated user ${email} with role ${role} and password: ${password}`);
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            await connection.execute(
                'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
                [name, email, hashedPassword, role, 'active']
            );
            console.log(`Created user ${email} with role ${role} and password: ${password}`);
        }
    } catch (error) {
        console.error('Error creating kitchen user:', error.message);
    } finally {
        await connection.end();
    }
}

createKitchenUser();
