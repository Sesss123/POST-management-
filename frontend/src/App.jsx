import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CashierDashboard from './pages/CashierDashboard';
import CashSalePage from './pages/CashSalePage';
import TableBillingPage from './pages/TableBillingPage';
import CustomerPage from './pages/CustomerPage';
import CustomerLedgerPage from './pages/CustomerLedgerPage';
import NayaBookPage from './pages/NayaBookPage';
import InvoicePage from './pages/InvoicePage';
import InvoiceDetailsPage from './pages/InvoiceDetailsPage';
import ItemsPage from './pages/ItemsPage';
import TablesPage from './pages/TablesPage';
import ReportsPage from './pages/ReportsPage';
import KitchenDisplay from './pages/KitchenDisplay';
import KOTOrdersPage from './pages/KOTOrdersPage';
import ShiftPage from './pages/ShiftPage';
import HeldBillsPage from './pages/HeldBillsPage';
import EODReportPage from './pages/EODReportPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';
import ReservationsPage from './pages/ReservationsPage';
import SuppliersPage from './pages/SuppliersPage';
import PurchasesPage from './pages/PurchasesPage';
import UsersPage from './pages/UsersPage';
import QuickRetailPage from './pages/QuickRetailPage';
import BusinessIntelligencePage from './pages/BusinessIntelligencePage';
import ExpensesPage from './pages/ExpensesPage';
import PublicMenuPage from './pages/PublicMenuPage';
import PublicReceiptPage from './pages/PublicReceiptPage';
import MarketingPage from './pages/MarketingPage';
import DeliveryOrdersPage from './pages/DeliveryOrdersPage';

// Super Admin Components
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard';
import ShopsPage from './pages/super-admin/ShopsPage';
import CreateShopPage from './pages/super-admin/CreateShopPage';
import ShopDetailsPage from './pages/super-admin/ShopDetailsPage';
import SuperAdminUsersPage from './pages/super-admin/SuperAdminUsersPage';
import SystemHealthPage from './pages/super-admin/SystemHealthPage';
import SuperAdminBackupsPage from './pages/super-admin/SuperAdminBackupsPage';
import SuperAdminAuditLogsPage from './pages/super-admin/SuperAdminAuditLogsPage';
import SuperAdminAnalytics from './pages/super-admin/SuperAdminAnalytics';
import SubscriptionsPage from './pages/super-admin/SubscriptionsPage';
import SubscriptionPaymentsPage from './pages/super-admin/SubscriptionPaymentsPage';
import SubscriptionPlansPage from './pages/super-admin/SubscriptionPlansPage';
import AnnouncementsPage from './pages/super-admin/AnnouncementsPage';
import SupportTicketsPage from './pages/super-admin/SupportTicketsPage';
import ShopMenuManagementPage from './pages/super-admin/ShopMenuManagementPage';
import SuperAdminSettingsPage from './pages/super-admin/SuperAdminSettingsPage';

import { ToastProvider } from './components/ui/Feedback';
import { useAuth } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';

const RoleRoute = ({ element, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-indigo-600 font-medium">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) {
    // Redirect to the first available route for this role
    if (user.role === 'waiter') return <Navigate to="/table-billing" />;
    if (user.role === 'kitchen') return <Navigate to="/kitchen" />;
    if (user.role === 'super_admin') return <Navigate to="/super-admin" />;
    return <Navigate to="/" />;
  }
  return element;
};

const IndexRouteHandler = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <DashboardPage />;
  if (user?.role === 'cashier') return <CashierDashboard />;
  if (user?.role === 'waiter') return <Navigate to="/table-billing" replace />;
  if (user?.role === 'kitchen') return <Navigate to="/kitchen" replace />;
  if (user?.role === 'super_admin') return <Navigate to="/super-admin" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <SettingsProvider>
          <ToastProvider>
            <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              {/* Public Routes — shop-scoped QR menus */}
              <Route path="/menu/:shopIdentifier/table/:tableNo" element={<PublicMenuPage />} />
              <Route path="/menu/:shopIdentifier" element={<PublicMenuPage />} />
              <Route path="/receipt/:uuid" element={<PublicReceiptPage />} />
              {/* Legacy fallback for old single-tenant links */}
              <Route path="/menu" element={<PublicMenuPage />} />
              <Route path="/menu/table/:tableNo" element={<PublicMenuPage />} />

              {/* Super Admin Routes */}
              <Route path="/super-admin" element={<RoleRoute roles={['super_admin']} element={<SuperAdminLayout />} />}>
                <Route index element={<SuperAdminDashboard />} />
                <Route path="shops" element={<ShopsPage />} />
                <Route path="shops/new" element={<CreateShopPage />} />
                <Route path="shops/:identifier" element={<ShopDetailsPage />} />
                <Route path="shops/:id/menu" element={<ShopMenuManagementPage />} />
                <Route path="subscriptions" element={<SubscriptionsPage />} />
                <Route path="subscription-payments" element={<SubscriptionPaymentsPage />} />
                <Route path="plans" element={<SubscriptionPlansPage />} />
                <Route path="announcements" element={<AnnouncementsPage />} />
                <Route path="tickets" element={<SupportTicketsPage />} />
                <Route path="users" element={<SuperAdminUsersPage />} />
                <Route path="system-health" element={<SystemHealthPage />} />
                <Route path="health" element={<Navigate to="/super-admin/system-health" replace />} />
                <Route path="backups" element={<SuperAdminBackupsPage />} />
                <Route path="analytics" element={<SuperAdminAnalytics />} />
                <Route path="audit-logs" element={<SuperAdminAuditLogsPage />} />
                <Route path="settings" element={<SuperAdminSettingsPage />} />
              </Route>
              
              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<RoleRoute roles={['admin', 'cashier', 'waiter', 'kitchen']} element={<IndexRouteHandler />} />} />
                <Route path="cash-sale" element={<RoleRoute roles={['admin', 'cashier']} element={<CashSalePage />} />} />
                <Route path="table-billing" element={<RoleRoute roles={['admin', 'cashier', 'waiter']} element={<TableBillingPage />} />} />
                <Route path="customers" element={<RoleRoute roles={['admin', 'cashier']} element={<CustomerPage />} />} />
                <Route path="customers/:id/ledger" element={<RoleRoute roles={['admin', 'cashier']} element={<CustomerLedgerPage />} />} />
                <Route path="naya-book" element={<RoleRoute roles={['admin', 'cashier']} element={<NayaBookPage />} />} />
                <Route path="invoices" element={<RoleRoute roles={['admin', 'cashier']} element={<InvoicePage />} />} />
                <Route path="invoices/:id" element={<RoleRoute roles={['admin', 'cashier']} element={<InvoiceDetailsPage />} />} />
                <Route path="items" element={<RoleRoute roles={['admin']} element={<ItemsPage />} />} />
                <Route path="tables" element={<RoleRoute roles={['admin']} element={<TablesPage />} />} />
                <Route path="reports" element={<RoleRoute roles={['admin']} element={<ReportsPage />} />} />
                <Route path="users" element={<RoleRoute roles={['admin']} element={<UsersPage />} />} />
                <Route path="kitchen" element={<RoleRoute roles={['admin', 'kitchen']} element={<KitchenDisplay />} />} />
                <Route path="kot-orders" element={<RoleRoute roles={['admin', 'cashier', 'waiter', 'kitchen']} element={<KOTOrdersPage />} />} />
                <Route path="shifts" element={<RoleRoute roles={['admin', 'cashier']} element={<ShiftPage />} />} />
                <Route path="held-bills" element={<RoleRoute roles={['admin', 'cashier']} element={<HeldBillsPage />} />} />
                <Route path="reports/eod" element={<RoleRoute roles={['admin']} element={<EODReportPage />} />} />
                <Route path="audit-logs" element={<RoleRoute roles={['admin']} element={<AuditLogsPage />} />} />
                <Route path="business-intelligence" element={<RoleRoute roles={['admin']} element={<BusinessIntelligencePage />} />} />
                <Route path="settings" element={<RoleRoute roles={['admin']} element={<SettingsPage />} />} />
                <Route path="reservations" element={<RoleRoute roles={['admin', 'cashier']} element={<ReservationsPage />} />} />
                <Route path="suppliers" element={<RoleRoute roles={['admin']} element={<SuppliersPage />} />} />
                <Route path="purchases" element={<RoleRoute roles={['admin']} element={<PurchasesPage />} />} />
                <Route path="quick-retail" element={<RoleRoute roles={['admin', 'cashier']} element={<QuickRetailPage />} />} />
                <Route path="expenses" element={<RoleRoute roles={['admin', 'cashier']} element={<ExpensesPage />} />} />
                <Route path="marketing" element={<RoleRoute roles={['admin']} element={<MarketingPage />} />} />
                <Route path="delivery-orders" element={<RoleRoute roles={['admin', 'cashier']} element={<DeliveryOrdersPage />} />} />
                
                {/* Fallback for other pages */}
                <Route path="*" element={<div className="p-8 text-center text-slate-400">Page under development</div>} />
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Router>
          </ToastProvider>
        </SettingsProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;
