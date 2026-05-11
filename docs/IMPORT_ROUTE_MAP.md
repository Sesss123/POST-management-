# RestoLedger POS SaaS - Import & Route Dependency Map

## Frontend Routes (App.jsx)

| Path | Component | Role Access | Layout | API Calls Used |
| :--- | :--- | :--- | :--- | :--- |
| `/login` | `LoginPage` | Public | None | `authApi.login` |
| `/dashboard` | `DashboardPage` | admin, super_admin | Main | `reportApi.getDashboard` |
| `/cashier-dashboard` | `CashierDashboard` | admin, cashier | Main | `reportApi.getCashierDashboard` |
| `/cash-sale` | `CashSalePage` | admin, cashier | Main | `invoiceApi.createCashSale`, `itemApi.getAll` |
| `/quick-retail` | `QuickRetailPage` | admin, cashier | Main | `invoiceApi.createQuickRetailSale` |
| `/table-billing` | `TableBillingPage` | admin, cashier | Main | `sessionApi.getActiveByTable`, `tableApi.getAll` |
| `/kitchen` | `KitchenDisplay` | admin, kitchen | Main | `kitchenApi.getActiveKots` |
| `/naya-book` | `NayaBookPage` | admin, cashier | Main | `customerApi.getDebtors` |
| `/held-bills` | `HeldBillsPage` | admin, cashier | Main | `heldBillApi.getAll` |
| `/items` | `ItemsPage` | admin | Main | `itemApi.getAll` |
| `/settings` | `SettingsPage` | admin | Main | `settingApi.getAll` |
| `/reservations` | `ReservationsPage` | admin, cashier | Main | `reservationApi.getAll` |
| `/super-admin` | `SuperAdminDashboard`| super_admin | SuperAdmin | `superAdminApi.getStats` |

## Backend API Endpoints (server.js)

| Prefix | Route File | Controller | Auth | DB Tables |
| :--- | :--- | :--- | :--- | :--- |
| `/api/auth` | `authRoutes.js` | `authController.js` | Public | `users`, `shops` |
| `/api/items` | `itemRoutes.js` | `itemController.js` | Protect | `items`, `categories` |
| `/api/customers` | `customerRoutes.js`| `customerController.js`| Protect | `customers`, `customer_ledgers` |
| `/api/invoices` | `invoiceRoutes.js` | `invoiceController.js` | Protect | `invoices`, `invoice_items` |
| `/api/tables` | `tableRoutes.js` | `tableController.js` | Protect | `tables` |
| `/api/reports` | `reportRoutes.js` | `reportController.js` | Protect | Multiple |
| `/api/kot` | `kotRoutes.js` | `kotController.js` | Protect | `kot_orders`, `kot_items` |
| `/api/kitchen` | `kitchenRoutes.js` | `kitchenController.js` | Protect | `kot_orders`, `kot_items` |
| `/api/super-admin`| `superAdminRoutes.js`| `superAdminController.js`| super_admin | All shops |
