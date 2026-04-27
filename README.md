# RestoLedger POS

A premium full-stack Restaurant POS and Credit Ledger System built for Sri Lankan restaurants.

## Features
- **Cash Sales**: Instant billing for walk-in customers.
- **Table Billing**: Manage dine-in orders with table status tracking.
- **Naya Book (Credit Ledger)**: Comprehensive customer credit management and payment tracking.
- **Member Profiles**: Detailed customer database with credit limits.
- **Professional Invoices**: Beautiful A4 and Thermal printer friendly designs.
- **Modern UI**: Clean, responsive, and premium design with glassmorphism and animations.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Lucide Icons, Axios.
- **Backend**: Node.js, Express.js, MySQL.
- **Auth**: JWT with Bcrypt hashing.

## Setup Instructions

### 1. Database Setup
1. Create a MySQL database named `restoledger_pos`.
2. Import `database/schema.sql`.
3. Import `database/seed.sql` for initial data.

### 2. Backend Setup
1. Navigate to `backend/`.
2. Install dependencies: `npm install`.
3. Configure `.env` with your DB credentials.
4. Start server: `npm start` (or `node server.js`).

### 3. Frontend Setup
1. Navigate to `frontend/`.
2. Install dependencies: `npm install`.
3. Start dev server: `npm run dev`.

## Demo Credentials
- **Admin**: admin@restopos.com / password
- **Cashier**: cashier@restopos.com / password

## Business Logic Notes
- **Credit Limit**: The system warns if a customer's balance exceeds their credit limit during a table sale.
- **Ledger**: Every credit sale adds a 'debit' entry, and every payment adds a 'credit' entry to the ledger.
- **Table Status**: Tables automatically move from 'available' to 'occupied' when items are added, and back to 'available' after checkout.
