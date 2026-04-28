const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
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

dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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
});
