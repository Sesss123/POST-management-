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

import { ToastProvider } from './components/ui/Feedback';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="cash-sale" element={<CashSalePage />} />
            <Route path="table-billing" element={<TableBillingPage />} />
            <Route path="customers" element={<CustomerPage />} />
            <Route path="naya-book" element={<NayaBookPage />} />
            <Route path="invoices" element={<InvoicePage />} />
            <Route path="invoices/:id" element={<InvoiceDetailsPage />} />
            <Route path="items" element={<ItemsPage />} />
            <Route path="tables" element={<TablesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="users" element={<UsersPage />} />
            
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
