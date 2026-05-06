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
2. Import `database/schema.sql` (Complete structure).
3. Import `database/seed.sql` (Initial data/Menu).

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

## Production Deployment & Security Checklist
1. **Environment Variables**: Never commit `.env` or `.env.local` files to version control. Use `.env.example` as a template for production servers.
2. **JWT Secret Rotation**: Change the `JWT_SECRET` in production. It must be at least 32 characters long.
3. **Database Credentials**: Ensure the database password is strong and set in the `.env` file (`DB_PASSWORD`). Do not use default credentials (e.g., `root` with no password).
4. **Secrets Audit**: Regularly review hardcoded values. VITE_ prefixed variables are safe for frontend, but backend secrets must remain out of the client bundle.

## Backup & Recovery

### 1. Manual Local Backup
To create a fresh backup of the database, run the following command from the root directory:
```bash
node backend/scripts/backupDatabaseLocal.js
```

### 2. Backup Location
All backups are stored as `.sql` files in:
`database/backups/`

### 3. Restoring Data
**Option A: Using phpMyAdmin**
1. Create a new database or select an existing one.
2. Click the **Import** tab.
3. Select the `.sql` backup file from `database/backups/`.
4. Click **Go** or **Import**.

**Option B: Using Command Line**
```bash
mysql -u root -p restoledgerdb < database/backups/restoledgerdb_backup_XXXX.sql
```
*(Note: For XAMPP with no password, remove `-p`)*

> [!WARNING]
> - Always perform a backup before running migrations or major updates.
> - Test your restoration process on a separate test database periodically.
> - **Never** commit backup files to GitHub.
