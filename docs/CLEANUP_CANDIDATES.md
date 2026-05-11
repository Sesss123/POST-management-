# RestoLedger POS SaaS - Cleanup Candidates

This document classifies files that are candidates for deletion, archiving, or merging.

## 🔴 DELETE (Confirmed Unused)
- `frontend/src/pages/ReservationPage.jsx` (Superceded by `ReservationsPage.jsx`)

## 🟡 ARCHIVE (Move to `archive/deleted-candidates/`)
- `backend/check_items_schema.js`
- `backend/check_settings.js`
- `backend/check_tables.js`
- `backend/clear_backup_logs.js`
- `backend/create_platform_settings.js`
- `backend/fix_backup_logs.js`
- `backend/seedSuperAdmin.js`
- `backend/seed_settings.js`
- `backend/scripts/apply_025_migration.js`
- `backend/scripts/apply_029_migration.js`
- `backend/scripts/apply_030_migration.js`
- `backend/scripts/apply_031_migration.js`
- `backend/scripts/apply_047_migration.js`
- `backend/scripts/apply_048_migration.js`
- `backend/scripts/apply_049_migration.js`
- `backend/scripts/apply_050_migration.js`
- `backend/scripts/apply_051_migration.js`

## 🟠 MERGE / CONSOLIDATE
- `backend/migrations/` and `backend/database/migrations/` -> Move all to `database/migrations/`
- `backend/services/nayaAccountService.js` (Confirm if any logic from old versions needs merging)

## 🔵 MANUAL REVIEW
- `backend/models/` (Confirm if any logic is used, most controllers use `db` directly)
- `backend/scratch/` (Review contents before deleting)
