const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

async function generateSchema() {
    console.log('Generating production schema from local database...');
    
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'restoledgerdb',
    };

    let connection;
    try {
        connection = await mysql.createConnection(config);
        
        // 1. Get all tables
        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        console.log(`Found ${tableNames.length} tables in local database.`);

        let sqlOutput = [];
        sqlOutput.push('-- RestoLedger POS Unified Production Schema');
        sqlOutput.push('-- Generated on: ' + new Date().toISOString());
        sqlOutput.push('-- This file contains the complete, up-to-date schema with all migrations applied.');
        sqlOutput.push('');
        sqlOutput.push('SET FOREIGN_KEY_CHECKS = 0;');
        sqlOutput.push('');

        // 2. Loop tables and get CREATE statement
        for (const tableName of tableNames) {
            // Skip backup logs or temporary test tables if any, but let's keep all 60 tables
            const [createResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
            let createSql = createResult[0]['Create Table'];
            
            // Clean up AUTO_INCREMENT value if present to start fresh
            createSql = createSql.replace(/AUTO_INCREMENT=\d+\s*/g, '');
            
            sqlOutput.push(`-- Create Table: ${tableName}`);
            sqlOutput.push(createSql + ';');
            sqlOutput.push('');
        }

        sqlOutput.push('SET FOREIGN_KEY_CHECKS = 1;');
        sqlOutput.push('');

        // 3. Write schema part to temporary file or variable
        const schemaSql = sqlOutput.join('\n');
        
        // Save to production_schema.sql
        const outputPath = path.join(__dirname, 'production_schema.sql');
        fs.writeFileSync(outputPath, schemaSql, 'utf8');
        console.log(`✔ Production schema successfully written to: ${outputPath}`);

    } catch (error) {
        console.error('Error generating schema:', error);
    } finally {
        if (connection) await connection.end();
    }
}

generateSchema();
