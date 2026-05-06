const { db } = require('../config/db');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('Please provide a migration file path.');
        process.exit(1);
    }

    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(absolutePath)) {
        console.error(`File not found: ${absolutePath}`);
        process.exit(1);
    }

    console.log(`Running migration: ${path.basename(absolutePath)}...`);
    const sql = fs.readFileSync(absolutePath, 'utf8');

    // Split by semicolon but ignore inside quotes
    const statements = sql
        .split(/;\s*$/m)
        .map(s => s.trim())
        .filter(s => s.length > 0);

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        for (const statement of statements) {
            console.log(`Executing: ${statement.substring(0, 100)}...`);
            await connection.query(statement);
        }
        await connection.commit();
        console.log('Migration completed successfully!');
    } catch (error) {
        await connection.rollback();
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        connection.release();
        process.exit(0);
    }
};

runMigration();
