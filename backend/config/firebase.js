const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

try {
    const serviceAccount = require('./serviceAccountKey.json');

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log('>>> Firebase: Connected successfully.');
} catch (error) {
    console.warn('>>> Firebase: Service account key missing or invalid. Please add config/serviceAccountKey.json');
}

const db = admin.firestore ? admin.firestore() : null;

module.exports = { admin, db };
