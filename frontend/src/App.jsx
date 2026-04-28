import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CashSalePage from './pages/CashSalePage';
import TableBillingPage from './pages/TableBillingPage';
import CustomerPage from './pages/CustomerPage';
import NayaBookPage from './pages/NayaBookPage';
import InvoicePage from './pages/InvoicePage';
import InvoiceDetailsPage from './pages/InvoiceDetailsPage';
import ItemsPage from './pages/ItemsPage';
import TablesPage from './pages/TablesPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import KitchenPage from './pages/KitchenDisplay';
import KOTOrdersPage from './pages/KOTOrdersPage';
import ShiftPage from './pages/ShiftPage';
import HeldBillsPage from './pages/HeldBillsPage';
import EODReportPage from './pages/EODReportPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';

import { ToastProvider } from './components/ui/Feedback';
import { useAuth } from './context/AuthContext';

const RoleRoute = ({ element, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-indigo-600 font-medium">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) {
    // Redirect to the first available route for this role
    if (user.role === 'waiter') return <Navigate to="/table-billing" />;
    if (user.role === 'kitchen') return <Navigate to="/kitchen" />;
    return <Navigate to="/" />;
  }
  return element;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<RoleRoute roles={['admin', 'manager', 'cashier']} element={<DashboardPage />} />} />
            <Route path="cash-sale" element={<RoleRoute roles={['admin', 'manager', 'cashier']} element={<CashSalePage />} />} />
            <Route path="table-billing" element={<RoleRoute roles={['admin', 'manager', 'cashier', 'waiter']} element={<TableBillingPage />} />} />
            <Route path="customers" element={<RoleRoute roles={['admin', 'manager', 'cashier']} element={<CustomerPage />} />} />
            <Route path="naya-book" element={<RoleRoute roles={['admin', 'manager', 'cashier']} element={<NayaBookPage />} />} />
            <Route path="invoices" element={<RoleRoute roles={['admin', 'manager', 'cashier']} element={<InvoicePage />} />} />
            <Route path="invoices/:id" element={<RoleRoute roles={['admin', 'manager', 'cashier']} element={<InvoiceDetailsPage />} />} />
            <Route path="items" element={<RoleRoute roles={['admin', 'manager']} element={<ItemsPage />} />} />
            <Route path="tables" element={<RoleRoute roles={['admin', 'manager']} element={<TablesPage />} />} />
            <Route path="reports" element={<RoleRoute roles={['admin', 'manager']} element={<ReportsPage />} />} />
            <Route path="users" element={<RoleRoute roles={['admin']} element={<UsersPage />} />} />
            <Route path="kitchen" element={<RoleRoute roles={['admin', 'manager', 'kitchen']} element={<KitchenPage />} />} />
            <Route path="kot-orders" element={<RoleRoute roles={['admin', 'manager', 'cashier', 'waiter', 'kitchen']} element={<KOTOrdersPage />} />} />
            <Route path="shifts" element={<RoleRoute roles={['admin', 'manager', 'cashier']} element={<ShiftPage />} />} />
            <Route path="held-bills" element={<RoleRoute roles={['admin', 'manager', 'cashier']} element={<HeldBillsPage />} />} />
            <Route path="reports/eod" element={<RoleRoute roles={['admin', 'manager']} element={<EODReportPage />} />} />
            <Route path="audit-logs" element={<RoleRoute roles={['admin']} element={<AuditLogsPage />} />} />
            <Route path="settings" element={<RoleRoute roles={['admin', 'manager']} element={<SettingsPage />} />} />
            
            {/* Fallback for other pages */}
            <Route path="*" element={<div className="p-8 text-center text-slate-400">Page under development</div>} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  </AuthProvider>
  );
}

export default App;
