import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ReminderProvider } from './context/ReminderContext';

import Layout from './components/layout/Layout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import LeadDetailPage from './pages/LeadDetailPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import QuotationsPage from './pages/QuotationsPage';
import OrdersPage from './pages/OrdersPage';
import PaymentsPage from './pages/PaymentsPage';
import RemindersPage from './pages/RemindersPage';
import SettingsPage from './pages/SettingsPage';
import UsersPage from './pages/UsersPage';

import SetupPage from './pages/SetupPage';
import InstallPrompt from './components/common/InstallPrompt';

// Protected Route Wrapper - for authenticated users only
const ProtectedRoute = () => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

// Admin Route Wrapper - Admin only
const AdminRoute = () => {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    setTimeout(() => toast.error("Access denied - Admin only"), 0);
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

// Manager Route Wrapper - Manager can oversee team but not configure
const ManagerRoute = () => {
  const { user, isAdmin, isManager } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin && !isManager) {
    setTimeout(() => toast.error("Access denied - Manager access required"), 0);
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

// Staff Route Wrapper - Staff and Admin
const StaffRoute = () => {
  const { user, isAdmin, isStaff, isManager } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin && !isStaff && !isManager) {
    setTimeout(() => toast.error("Access denied - Staff access required"), 0);
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ReminderProvider>
          <InstallPrompt />
          <Toaster position="top-center" />

          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/setup" element={<SetupPage />} />

            {/* Default Redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protected Layout Block */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>

                {/* Pages accessible to all authenticated users */}
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/reminders" element={<RemindersPage />} />

                {/* Staff & Manager & Admin Routes */}
                <Route element={<StaffRoute />}>
                  <Route path="/leads" element={<LeadsPage />} />
                  <Route path="/leads/:id" element={<LeadDetailPage />} />

                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/customers/:customerId" element={<CustomerDetailPage />} />

                  <Route path="/quotations" element={<QuotationsPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                </Route>

                {/* Admin Only Routes */}
                <Route element={<AdminRoute />}>
                  <Route path="/payments" element={<PaymentsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/users" element={<UsersPage />} />
                </Route>

              </Route>
            </Route>

            {/* Catch All */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

        </ReminderProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

