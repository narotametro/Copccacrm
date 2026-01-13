import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { COPCCAProtectedRoute } from '@/components/auth/COPCCAProtectedRoute';
import { COPCCAAdminLayout } from '@/components/layout/COPCCAAdminLayout';
import Login from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { ResetPassword } from '@/pages/auth/ResetPassword';
import { COPCCAAdminLogin } from '@/pages/auth/COPCCAAdminLogin';
import { AcceptInvite } from '@/pages/auth/AcceptInvite';
import Dashboard from '@/pages/Dashboard';
import { Customers } from '@/pages/Customers';
import { SalesPipeline } from '@/pages/SalesPipeline';
import { Sales } from '@/pages/Sales';
import { AfterSales } from '@/pages/AfterSales';
import { DebtCollection } from '@/pages/DebtCollection';
import { Competitors } from '@/pages/Competitors';
import { Marketing } from '@/pages/Marketing';
import { KPITracking } from '@/pages/KPITracking';
import { Reports } from '@/pages/Reports';
import { UserManagement } from '@/pages/UserManagement';
import { Products } from '@/pages/Products';
import { Profile } from '@/pages/Profile';
import { Settings } from '@/pages/Settings';
import { MyWorkplace } from '@/pages/MyWorkplace';
import { LandingPage } from '@/pages/LandingPage';
import { Notifications } from '@/pages/Notifications';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminCompanies } from '@/pages/admin/AdminCompanies';
import { AdminSubscriptions } from '@/pages/admin/AdminSubscriptions';
import { AdminSystem } from '@/pages/admin/AdminSystem';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { SharedDataProvider } from '@/context/SharedDataContext';

const AppRoutes = () => {
  const { user, loading } = useAuthStore();
  const [maxLoadingReached, setMaxLoadingReached] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setMaxLoadingReached(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [loading]);
  
  if (loading && !maxLoadingReached) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/invite" element={<AcceptInvite />} />
      <Route
        path="/login"
        element={user ? <Navigate to="/app/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/app/dashboard" replace /> : <Register />}
      />
      <Route
        path="/forgot-password"
        element={user ? <Navigate to="/app/dashboard" replace /> : <ForgotPassword />}
      />
      <Route
        path="/reset-password"
        element={user ? <Navigate to="/app/dashboard" replace /> : <ResetPassword />}
      />

      {/* COPCCA Admin Routes - Completely Separate */}
      <Route path="/copcca-admin/login" element={<COPCCAAdminLogin />} />
      <Route
        path="/copcca-admin/*"
        element={
          <COPCCAProtectedRoute>
            <COPCCAAdminLayout />
          </COPCCAProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="companies" element={<AdminCompanies />} />
        <Route path="subscriptions" element={<AdminSubscriptions />} />
        <Route path="system" element={<AdminSystem />} />
        <Route path="" element={<Navigate to="/copcca-admin/dashboard" replace />} />
      </Route>

      {/* Protected Routes with AppLayout */}
      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="pipeline" element={<SalesPipeline />} />
        <Route path="sales" element={<Sales />} />
        <Route path="after-sales" element={<AfterSales />} />
        <Route path="debt-collection" element={<DebtCollection />} />
        <Route path="competitors" element={<Competitors />} />
        <Route path="marketing" element={<Marketing />} />
        <Route path="kpi-tracking" element={<KPITracking />} />
        <Route path="reports" element={<Reports />} />
        <Route path="products" element={<Products />} />
        <Route path="notifications" element={<Notifications />} />
        <Route 
          path="users" 
          element={
            <ProtectedRoute requiredRole="admin">
              <UserManagement />
            </ProtectedRoute>
          } 
        />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="my-workplace" element={<MyWorkplace />} />
        <Route path="" element={<Navigate to="/app/dashboard" replace />} />
      </Route>

      {/* Redirect root to dashboard if authenticated */}
      <Route
        path="*"
        element={<Navigate to={user ? "/app/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
};

const App = () => {
  const initialize = useAuthStore((state) => state.initialize);
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    if (!initialized) {
      initialize().finally(() => {
        setInitialized(true);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CurrencyProvider>
      <SharedDataProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppRoutes />
        </BrowserRouter>
      </SharedDataProvider>
    </CurrencyProvider>
  );
};

export default App;
