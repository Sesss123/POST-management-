# RestoLedger POS SaaS - Production Launch Checklist

This checklist ensures all critical security, performance, and operational requirements are met before the platform goes live.

## 1. Environment Configuration
- [ ] `NODE_ENV` is set to `production` in `.env`.
- [ ] `JWT_SECRET` is a strong, unique 64-character string.
- [ ] `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` are correctly set for the production database.
- [ ] `FRONTEND_URL` is set to the production domain.
- [ ] `VITE_API_BASE_URL` in frontend `.env` points to the production API.
- [ ] `.env` files are NOT committed to version control.

## 2. Infrastructure & Deployment (VPS)
- [ ] Node.js (v18+) and npm installed.
- [ ] MySQL (v8+) installed and secured with `mysql_secure_installation`.
- [ ] Nginx configured as a reverse proxy for the backend and serving the frontend build.
- [ ] SSL Certificates installed (Let's Encrypt / Certbot).
- [ ] PM2 installed and configured to keep the backend running (`pm2 start server.js --name restoledger-api`).
- [ ] Firewall (UFW) configured to allow only ports 80, 443, and 22.

## 3. Database Readiness
- [ ] All migrations from `database/migrations/` have been applied in order.
- [ ] Stored procedures (for multi-tenancy) are correctly created.
- [ ] Database backup system (`backupScheduler.js`) is verified and logs success.
- [ ] Manual "Backup & Restore" test completed to ensure data integrity.

## 4. Security Audit
- [ ] **Rate Limiting**: Enabled for all API routes (1000/15min) and Auth (10/15min).
- [ ] **Helmet**: `app.use(helmet())` is active in `server.js`.
- [ ] **CORS**: Restricted to authorized `FRONTEND_URL`.
- [ ] **Error Handling**: Stack traces are hidden in production (verify `NODE_ENV`).
- [ ] **Tenant Isolation**: Verified that `shop_id` is enforced across all business controllers.
- [ ] **Audit Logs**: Verified that system actions are correctly logged.

## 5. POS Workflow Verification
- [ ] **Cashier Flow**: Login -> Open Shift -> Create Cash Sale -> Generate KOT -> Close Shift.
- [ ] **Table Billing**: Open Table -> Add Items -> Print Bill -> Quick Cash -> Table Free.
- [ ] **Kitchen Display**: KDS reflects new orders in real-time.
- [ ] **Naya Book**: Credit sales correctly record in customer ledger.
- [ ] **Public Menu**: Digital menu accessible via shop slug and table number.

## 6. SaaS Lifecycle Verification
- [ ] **Super Admin**: Can create shops and shop-admin users.
- [ ] **Subscriptions**: Manual suspension/unlocking works.
- [ ] **Onboarding**: Shop creation provisions default settings and menu templates.

## 7. Rollback Plan
- [ ] **Step 1**: Export full database dump before any deployment.
- [ ] **Step 2**: If failure occurs, revert code using `git checkout <previous_tag>`.
- [ ] **Step 3**: Restore database dump using `mysql -u root -p db_name < backup.sql`.
- [ ] **Step 4**: Restart PM2 and Nginx.

---
*Last Updated: 2026-05-06*
