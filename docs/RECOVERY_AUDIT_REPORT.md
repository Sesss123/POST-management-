# RestoLedger POS SaaS - Recovery Audit Report

This report documents the current state of the codebase, identifying areas of messiness, duplication, and structural inconsistency that require cleanup and stabilization.

## 1. Directory Structure & Organization

| Area | Status | Issues Found |
| :--- | :--- | :--- |
| **Backend Root** | ⚠️ MESSY | Multiple utility/maintenance scripts scattered in root (`check_settings.js`, `seed_settings.js`, etc.). These should be in `scripts/`. |
| **Database/Migrations** | ⚠️ FRAGMENTED | Migrations are scattered across `database/migrations`, `backend/database/migrations`, and `backend/migrations`. No single source of truth for schema evolution. |
| **Frontend Pages** | ⚠️ REDUNDANT | Duplicate files found: `ReservationPage.jsx` vs `ReservationsPage.jsx`. `ReservationsPage.jsx` is the active one. |
| **Scripts** | ⚠️ DISORGANIZED | `backend/scripts` contains a mix of migrations, QA, setup, and debugging scripts without clear sub-categorization. |

## 2. File Redundancy & Dead Code

| File / Area | Issue | Risk | Recommended Action | Status |
| :--- | :--- | :--- | :--- | :--- |
| `frontend/src/pages/ReservationPage.jsx` | Duplicate of `ReservationsPage.jsx` | Developer confusion, stale code. | Delete after confirming `ReservationsPage.jsx` is 100% complete. | 🔴 CANDIDATE |
| `backend/*.js` (scripts in root) | Scattered scripts | Root clutter, hard to find tools. | Move to `backend/scripts/maintenance/` or `setup/`. | 🔴 CANDIDATE |
| `backend/migrations` (multiple locations) | Fragmented migrations | Deployment failure, schema drift. | Consolidate into `database/migrations`. | 🔴 CANDIDATE |
| `backend/database` | Redundant folder | Structural mess. | Merge contents into root `database/` and delete. | 🔴 CANDIDATE |

## 3. Architecture & Logic

| Area | Observation | Recommendation |
| :--- | :--- | :--- |
| **Controllers** | Most controllers are well-scoped, but some like `invoiceController.js` are becoming very large. | Monitor for potential split (e.g., `retailInvoiceController` vs `restaurantInvoiceController`) in future phases. |
| **Services** | Naya/Loyalty logic is currently spread across controllers and services. | Centralize all Naya logic into `nayaAccountService.js`. |
| **API Client** | `frontend/src/api/api.js` is the main manifest, but some pages might still use direct `apiClient` calls. | Ensure all pages use the manifest functions for consistency. |

## 4. Environment & Dependencies

| Area | Issue | Status |
| :--- | :--- | :--- |
| **JWT Security** | `JWT_SECRET` length is checked but not strictly enforced (only warning). | Enforce min 32 chars in production. |
| **Unused Packages** | Potential unused packages in `package.json`. | Run `depcheck` during cleanup phase. |

## 5. Summary of Audit Findings

The project is functional but suffers from "prompt-driven fragmentation". New features were often added without strictly adhering to the original structure, leading to scattered scripts and duplicated component files. The database migration path is particularly messy and needs a unified "source of truth".

**Total "Mess" Score: 6.5/10** (Functional but structurally unstable for long-term maintenance).
