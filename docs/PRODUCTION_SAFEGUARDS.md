# RestoLedger POS - Production Safeguards & Protocols

This document outlines the critical safeguards, deployment checks, and emergency protocols required for a stable production environment. It serves as a comprehensive guide for administrators to ensure business continuity, security, and data integrity.

---

## 1. Timezone Configuration (Asia/Colombo)
**Risk:** Incorrect timestamps on invoices and KOTs can cause major accounting issues and delayed kitchen orders.
**Action:** 
- Ensure the production server OS timezone is set to `Asia/Colombo`.
- Enforce the timezone in the MySQL configuration (`default-time-zone='+05:30'`).
- Ensure the Node.js environment variable `TZ=Asia/Colombo` is set in the PM2 ecosystem file or Docker container.

## 2. Browser Version & Cache Refresh Strategy
**Risk:** Cashiers using outdated browsers may experience UI bugs, or heavy caching might prevent them from receiving critical frontend updates.
**Action:**
- **Cache Busting:** Vite automatically hashes filenames on build. Ensure your Nginx configuration sets `Cache-Control: no-cache` for `index.html`, while allowing long caching for `/assets/`.
- **Browser Requirements:** RestoLedger requires modern browsers supporting CSS Grid and ES6 (Chrome 90+, Safari 14+, Firefox 88+).

## 3. SSL Renewal & Security
**Risk:** Expired SSL certificates will instantly break frontend-to-backend API communication due to Mixed Content and CORS strictness.
**Action:**
- Set up automated renewals using `certbot` (Let's Encrypt).
- Create a cron job: `0 0,12 * * * root python3 -c 'import random; import time; time.sleep(random.random() * 3600)' && certbot renew -q`
- Add a calendar reminder for manual verification 3 days before expiry.

## 4. Cashier Account Separation (Training)
**Risk:** Multiple cashiers sharing a single login destroys audit log integrity and makes it impossible to trace unauthorized voids or Naya manipulation.
**Action:**
- **Mandatory Policy:** Every cashier must have their own unique PIN/Password.
- **Audit:** Super Admins should frequently check the "Platform Users" tab to ensure accounts are not being shared.

## 5. Migration Safety Rules
**Risk:** Running `ALTER TABLE` queries on live production databases can lock tables and cause data loss or downtime.
**Action:**
- **Rule 1:** Always run `mysqldump` to create a manual backup **before** applying any migration script.
- **Rule 2:** Test all migrations on a local or staging database with cloned data before applying to production.
- **Rule 3:** Never delete columns unless absolutely necessary; prefer soft-deprecating fields.

## 6. PM2 Auto-Restart and Boot Persistence
**Risk:** If the VPS restarts automatically after a provider patch or unexpected outage, the backend processes will not resume automatically, leading to extended downtime.
**Action:**
- Execute `pm2 save` to persist the current process list.
- Run `pm2 startup` and follow the generated instructions to ensure PM2 launches on OS boot.
- Verify status using `pm2 status` to confirm the backend is successfully daemonized.

## 7. Disk Space and Log Retention
**Risk:** Excessive log growth or unpurged backups can fill the disk. A disk at 100% capacity will cause MySQL to abruptly crash and corrupt active tables.
**Action:**
- Periodically check disk space using `df -h`. Treat 80% usage as a critical warning.
- Ensure the backend configuration enforces backup retention limits (e.g., delete automated backups older than 14 days).
- Implement log rotation (`logrotate` for system logs, Winston built-in rotation for Node processes) to prevent log inflation.

## 8. Backup Restore Verification
**Risk:** Generating backups without testing them creates a false sense of security; silent corruption can render SQL dumps useless during an actual crisis.
**Action:**
- **Mandatory Test:** Perform a monthly manual restore test.
- Create a temporary dummy database (`restoledgerdb_test`).
- Import the latest automated `.sql` backup.
- Validate table counts and ensure Super Admin/Admin login seeds are fully functional. A backup strategy is considered incomplete until the restore is verified.

## 9. Database Consistency Checks
**Risk:** Race conditions or orphaned records can silently erode accounting accuracy (e.g., negative stock, mismatched credit ledgers).
**Action:**
- Schedule weekly audits using scripts like `db_audit.js` and `checkNayaConsistency.js`.
- Scan for negative values in the `stock_qty` column.
- Verify that customer `current_balance` directly mirrors the sum of their `unpaid` invoices.

## 10. Payment Gateway Fallback
**Risk:** Reliance entirely on digital payment gateways (QR/Cards) halts business if the gateway provider goes down.
**Action:**
- If the primary gateway fails, ensure cashiers are trained to pivot to Cash or Manual Card/Naya flows immediately.
- **Security Rule:** Never trust frontend-reported "Paid" statuses for digital integrations; payment validation must always be confirmed by backend webhook polling before marking the invoice as paid.

## 11. Manual Business Continuity Procedure
**Risk:** Prolonged power or internet outages can cripple the entire digital POS workflow.
**Action:**
- Keep physical, pre-numbered KOT pads and a manual invoice/receipt book readily available near the terminal.
- Maintain documented procedures detailing how cashiers should enter the "missed" manual sales into the system once power/internet is restored.
- Train all floor staff on this "Outage Mode" at least twice a year.

## 12. Support SLA / Response Levels
Establish clear operational response times for incidents:
- **Critical:** Platform or POS is completely down. (Immediate Response)
- **High:** Peripheral hardware (printer) or payment gateway integration failure.
- **Medium:** Report generation errors or menu item configuration bugs.
- **Low:** UI tweaks, feature requests, or staff training inquiries.

## 13. Security Operations
**Risk:** Stale secrets or unchecked account access compromises sensitive customer and financial data.
**Action:**
- Rotate the `JWT_SECRET` strictly during scheduled maintenance windows, as changing it will instantly invalidate all active sessions and log out all users.
- Enforce the strict 1:1 Cashier-to-Account rule.
- Super Admins must review the `audit_logs` weekly to detect unauthorized voids, massive discounts, or suspicious login attempts.

## 14. Deployment Rollback
**Risk:** A bug in a new release can halt operations during peak service hours.
**Action:**
- **Pre-Deploy:** Always create a `git tag` (e.g., `v1.2.0`) and run a manual database backup.
- **Rollback:** If a critical bug is detected, immediately `git checkout` the previous stable tag.
- **DB Reversion:** Restore the pre-deploy database dump **only** if the new code structurally corrupted the data; otherwise, keep the current data to preserve new orders.
- **Reset:** Run `pm2 restart backend` and `nginx -s reload` to flush the new environment.

---

## 15. Emergency Support Checklist
If the POS experiences a critical failure during peak hours, follow these steps:
1. **Immediate Triage:** Access the Super Admin System Health Dashboard to identify database connectivity or missing tables.
2. **Check Logs:** SSH into the server and run `pm2 logs backend --lines 100` to find unhandled rejections.
3. **Restart Service:** If the service is hung, run `pm2 restart backend`.
4. **Hardware Fallback:** If internet is down, inform cashiers to manually write KOTs. RestoLedger does not currently support offline syncing.
5. **Restore:** If data corruption is found, run the restore script using the latest automated local backup.
