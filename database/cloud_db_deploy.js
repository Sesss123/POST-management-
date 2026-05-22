const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function run() {
    console.log('==============================================');
    console.log('RestoLedger Cloud Database Deployment Wizard');
    console.log('==============================================');
    
    // Read defaults from env
    const defaultHost = 'mysql-3b65f999-sehas.f.aivencloud.com';
    const defaultPort = '20280';
    const defaultUser = 'avnadmin';
    const defaultDB = 'defaultdb';
    
    const host = await askQuestion(`Enter Cloud DB Host [${defaultHost}]: `) || defaultHost;
    const portStr = await askQuestion(`Enter Cloud DB Port [${defaultPort}]: `) || defaultPort;
    const port = parseInt(portStr, 10);
    const user = await askQuestion(`Enter Cloud DB User [${defaultUser}]: `) || defaultUser;
    const password = await askQuestion('Enter Cloud DB Password: ');
    const database = await askQuestion(`Enter Cloud DB Name [${defaultDB}]: `) || defaultDB;
    
    if (!password) {
        console.error('✘ Error: Password is required to connect to the cloud database.');
        rl.close();
        return;
    }
    
    console.log('\nConnecting to cloud database...');
    let connection;
    try {
        connection = await mysql.createConnection({
            host,
            port,
            user,
            password,
            database,
            ssl: { rejectUnauthorized: false }
        });
        console.log('✔ Connected successfully to cloud database!');
    } catch (error) {
        console.error('✘ Connection failed:', error.message);
        rl.close();
        return;
    }
    
    try {
        // Run Schema
        console.log('\nDeploying Schema (production_schema.sql)...');
        const schemaPath = path.join(__dirname, 'production_schema.sql');
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`production_schema.sql not found at ${schemaPath}`);
        }
        
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        const schemaStatements = schemaSql
            .split(/;\r?\n/)
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
            
        console.log(`Executing ${schemaStatements.length} schema statements...`);
        for (let i = 0; i < schemaStatements.length; i++) {
            const stmt = schemaStatements[i];
            try {
                await connection.query(stmt);
            } catch (err) {
                console.warn(`⚠️ Warning executing statement ${i + 1}:`, err.message);
                console.log('Statement details:', stmt.substring(0, 100) + '...');
            }
        }
        console.log('✔ Schema deployed successfully!');
        
        // Run Seed
        console.log('\nDeploying Seed Data (production_seed.sql)...');
        const seedPath = path.join(__dirname, 'production_seed.sql');
        if (!fs.existsSync(seedPath)) {
            throw new Error(`production_seed.sql not found at ${seedPath}`);
        }
        
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        const seedStatements = seedSql
            .split(/;\r?\n/)
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
            
        console.log(`Executing ${seedStatements.length} seed statements...`);
        for (let i = 0; i < seedStatements.length; i++) {
            const stmt = seedStatements[i];
            try {
                await connection.query(stmt);
            } catch (err) {
                console.warn(`⚠️ Warning executing statement ${i + 1}:`, err.message);
                console.log('Statement details:', stmt.substring(0, 100) + '...');
            }
        }
        console.log('✔ Seed data deployed successfully!');
        console.log('\n==============================================');
        console.log('🎉 Cloud Database Setup Completed Successfully!');
        console.log('==============================================');
    } catch (error) {
        console.error('✘ Deployment failed:', error.message);
    } finally {
        await connection.end();
        rl.close();
    }
}

run();
