# RestoLedger POS SaaS - Target Project Structure

This document defines the finalized, clean structure for the RestoLedger project.

## Backend Structure

```text
backend/
  server.js
  config/
    db.js
    env.js
  middleware/
    authMiddleware.js
    tenantMiddleware.js
    subscriptionMiddleware.js
    errorMiddleware.js
    idempotencyMiddleware.js
  utils/
    auditLogger.js
    cache.js
    identifier.js
    pricingCalculator.js
  controllers/
    authController.js
    userController.js
    itemController.js
    invoiceController.js
    customerController.js
    tableSessionController.js
    kotController.js
    kitchenController.js
    heldBillController.js
    reportController.js
    settingController.js
    superAdminController.js
    backupController.js
    ... (other specific feature controllers)
  services/
    nayaAccountService.js
    subscriptionService.js
    localBackupService.js
    paymentGatewayService.js
    smsService.js
    loyaltyService.js
  routes/
    authRoutes.js
    userRoutes.js
    itemRoutes.js
    invoiceRoutes.js
    customerRoutes.js
    tableSessionRoutes.js
    kotRoutes.js
    kitchenRoutes.js
    heldBillRoutes.js
    reportRoutes.js
    settingRoutes.js
    superAdminRoutes.js
    backupRoutes.js
    ... (matching controllers)
  scripts/
    maintenance/
      db_audit.js
      checkNayaConsistency.js
      clear_backup_logs.js
    setup/
      seedSuperAdmin.js
      seed_settings.js
      runMigrations.js
    backup/
      backupDatabaseLocal.js
```

## Frontend Structure

```text
frontend/src/
  App.jsx
  api/
    apiClient.js
    api.js
  components/
    layout/
    ui/
    pos/
    invoice/
    naya/
    tables/
    public-menu/
    super-admin/
  pages/
    LoginPage.jsx
    DashboardPage.jsx
    CashierDashboard.jsx
    CashSalePage.jsx
    QuickRetailPage.jsx
    TableBillingPage.jsx
    KitchenDisplay.jsx
    NayaBookPage.jsx
    HeldBillsPage.jsx
    ItemsPage.jsx
    SettingsPage.jsx
    PublicMenuPage.jsx
    InvoicesPage.jsx
    CustomersPage.jsx (to be renamed from CustomerPage.jsx)
    super-admin/
      SuperAdminDashboard.jsx
      ShopsPage.jsx
      CreateShopPage.jsx
      ShopDetailsPage.jsx
      SubscriptionsPage.jsx
      SystemHealthPage.jsx
      SuperAdminAuditLogsPage.jsx
      SuperAdminBackupsPage.jsx
      SuperAdminSettingsPage.jsx
```

## Database Structure

```text
database/
  schema.sql            (Master schema)
  seed.sql              (Master seeds)
  migrations/           (All migration history files)
  backups/              (Generated SQL backups - gitignored)
```
