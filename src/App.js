import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';

import LeadsPage from './pages/leads/LeadsPage';
import CustomersPage from './pages/customers/CustomersPage';
import OrdersPage from './pages/orders/OrdersPage';
import QuotationsPage from './pages/quotations/QuotationsPage';
import InvoicesPage from './pages/invoices/InvoicesPage';

// Placeholder or active module shells
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Module routes with permission guards */}
              <Route element={<ProtectedRoute moduleName="leads" />}>
                <Route path="/leads" element={<LeadsPage />} />
              </Route>

              <Route element={<ProtectedRoute moduleName="customers" />}>
                <Route path="/customers" element={<CustomersPage />} />
              </Route>

              <Route element={<ProtectedRoute moduleName="orders" />}>
                <Route path="/orders" element={<OrdersPage />} />
              </Route>

              <Route element={<ProtectedRoute moduleName="quotations" />}>
                <Route path="/quotations" element={<QuotationsPage />} />
              </Route>

              <Route element={<ProtectedRoute moduleName="invoices" />}>
                <Route path="/invoices" element={<InvoicesPage />} />
              </Route>

              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
