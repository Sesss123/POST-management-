const { encrypt, decrypt } = require('../utils/cryptoVault');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });

async function runSecurityTest() {
    console.log('=== RESTOLEDGER SECURITY TEST ===\n');

    // 1. Encryption Test
    console.log('1. Testing Field-Level Encryption...');
    try {
        const original = '12345-6789012-3'; // Mock NIC
        const encrypted = encrypt(original);
        const decrypted = decrypt(encrypted);
        
        if (decrypted === original && encrypted !== original) {
            console.log('   [PASS] Encryption/Decryption roundtrip successful.');
            console.log(`   [DEBUG] Encrypted format: ${encrypted.split(':')[0]}:...`);
        } else {
            throw new Error('Decryption mismatch');
        }
    } catch (err) {
        console.error('   [FAIL] Encryption test failed:', err.message);
    }

    // 2. Password Hash Test
    console.log('\n2. Testing Password Hashing...');
    try {
        const pass = 'Resto123!';
        const hash = await bcrypt.hash(pass, 10);
        const isMatch = await bcrypt.compare(pass, hash);
        
        if (isMatch && !hash.includes(pass)) {
            console.log('   [PASS] Password hashing verified.');
        } else {
            throw new Error('Hash comparison failed');
        }
    } catch (err) {
        console.error('   [FAIL] Password hashing test failed:', err.message);
    }

    // 3. Environment Audit
    console.log('\n3. Auditing Environment...');
    const criticalEnv = ['JWT_SECRET', 'DATA_ENCRYPTION_KEY', 'DB_PASSWORD'];
    criticalEnv.forEach(env => {
        const val = process.env[env];
        if (val && val.length >= 16) {
            console.log(`   [PASS] ${env} is set and sufficiently long.`);
        } else {
            console.log(`   [WARNING] ${env} is weak or missing!`);
        }
    });

    console.log('\n=== SECURITY AUDIT COMPLETE ===');
}

runSecurityTest().catch(console.error);
