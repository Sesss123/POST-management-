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
const gatewayPaymentRoutes = require('./routes/paymentGatewayRoutes');
const publicMenuRoutes = require('./routes/publicMenuRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const supportTicketRoutes = require('./routes/supportTicketRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const backupScheduler = require('./services/backupScheduler');
const tenantMiddleware = require('./middleware/tenantMiddleware');
const { subscriptionMiddleware } = require('./middleware/subscriptionMiddleware');
const superAdminRoutes = require('./routes/superAdminRoutes');
const { protect } = require('./middleware/authMiddleware');
const idempotency = require('./middleware/idempotencyMiddleware');

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

// Rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login attempts per 15 mins
    message: { success: false, message: 'Too many login attempts, please try again later.' }
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // General limit: 1000 requests per 15 mins
    message: { success: false, message: 'Too many requests from this IP, please try again later.' },
    skip: (req) => req.path.startsWith('/api/kitchen') // Skip KDS polling from internal network if possible
});

const publicMenuLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300, // 300 requests per 15 mins for public menu
    message: { success: false, message: 'Public menu access limit reached. Please try again later.' }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/public-menu', publicMenuLimiter);

app.use(express.json({ limit: '1mb' }));

// Public/Auth Routes
app.use('/api/auth', authRoutes);
app.use('/api/public-menu', publicMenuRoutes);

// Helper: standard middleware chain for all shop-scoped routes
const shopMiddleware = [protect, tenantMiddleware, subscriptionMiddleware, idempotency];

app.use('/api/items',          ...shopMiddleware, itemRoutes);
app.use('/api/customers',      ...shopMiddleware, customerRoutes);
app.use('/api/invoices',       ...shopMiddleware, invoiceRoutes);
app.use('/api/tables',         ...shopMiddleware, tableRoutes);
app.use('/api/payments',       ...shopMiddleware, paymentRoutes);
app.use('/api/reports',        ...shopMiddleware, reportRoutes);
app.use('/api/users',          ...shopMiddleware, userRoutes);
app.use('/api/kot',            ...shopMiddleware, kotRoutes);
app.use('/api/table-sessions', ...shopMiddleware, sessionRoutes);
app.use('/api/shifts',         ...shopMiddleware, shiftRoutes);
app.use('/api/settings',       ...shopMiddleware, settingRoutes);
app.use('/api/permissions',    ...shopMiddleware, require('./routes/permissionRoutes'));
app.use('/api/audit-logs',     ...shopMiddleware, auditRoutes);
app.use('/api/held-bills',     ...shopMiddleware, heldBillRoutes);
app.use('/api/kitchen',        ...shopMiddleware, kitchenRoutes);
app.use('/api/reservations',   ...shopMiddleware, reservationRoutes);
app.use('/api/promotions',     ...shopMiddleware, promotionRoutes);
app.use('/api/combos',         ...shopMiddleware, comboRoutes);
app.use('/api/suppliers',      ...shopMiddleware, supplierRoutes);
app.use('/api/purchases',      ...shopMiddleware, purchaseRoutes);
app.use('/api/modifiers',      ...shopMiddleware, modifierRoutes);
app.use('/api/delivery-orders', ...shopMiddleware, require('./routes/deliveryRoutes'));
app.use('/api/marketing',      ...shopMiddleware, require('./routes/marketingRoutes'));
app.use('/api/stock',          ...shopMiddleware, require('./routes/stockRoutes'));
app.use('/api/backups',        ...shopMiddleware, backupRoutes);
app.use('/api/payments/gateway', ...shopMiddleware, gatewayPaymentRoutes);
app.use('/api/announcements', ...shopMiddleware, announcementRoutes);
app.use('/api/support/tickets', ...shopMiddleware, supportTicketRoutes);
app.use('/api/expenses',       ...shopMiddleware, expenseRoutes);
app.use('/api/super-admin',    superAdminRoutes);

// Base route
app.get('/', (req, res) => {
    res.send('RestoLedger POS API is running...');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }
    
    res.status(err.status || 500).json({ 
        success: false, 
        message: process.env.NODE_ENV === 'production' 
            ? 'An internal server error occurred.' 
            : err.message || 'Something went wrong!' 
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Start automated backups
    backupScheduler.start();
});
