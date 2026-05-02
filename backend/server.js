const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const { validateEnv } = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const customerRoutes = require('./routes/customerRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const tableRoutes = require('./routes/tableRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const kotRoutes = require('./routes/kotRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const settingRoutes = require('./routes/settingRoutes');
const auditRoutes = require('./routes/auditRoutes');
const heldBillRoutes = require('./routes/heldBillRoutes');
const kitchenRoutes = require('./routes/kitchenRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const comboRoutes = require('./routes/comboRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const modifierRoutes = require('./routes/modifierRoutes');
const backupRoutes = require('./routes/backupRoutes');
const backupScheduler = require('./services/backupScheduler');

dotenv.config();

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');


// Validate Environment Variables
validateEnv();

connectDB();

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting for auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { success: false, message: 'Too many login attempts, please try again later' }
});
app.use('/api/auth/login', authLimiter);

app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/kot', kotRoutes);
app.use('/api/table-sessions', sessionRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/held-bills', heldBillRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/combos', comboRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/modifiers', modifierRoutes);
app.use('/api/backups', backupRoutes);

// Base route
app.get('/', (req, res) => {
    res.send('RestoLedger POS API is running...');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Start automated backups
    backupScheduler.start();
});
