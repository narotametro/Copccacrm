import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { AppLayout } from '@/components/layout/AppLayout';
import { LandingPage } from '@/pages/LandingPage';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { ResetPassword } from '@/pages/auth/ResetPassword';
import { Dashboard } from '@/pages/Dashboard';
import { Customers } from '@/pages/Customers';
import { SalesPipeline } from '@/pages/SalesPipeline';
import { Products } from '@/pages/Products';
import { AfterSales } from '@/pages/AfterSales';
import { DebtCollection } from '@/pages/DebtCollection';
import { Competitors } from '@/pages/Competitors';
import { SalesStrategies } from '@/pages/SalesStrategies';
import { KPITracking } from '@/pages/KPITracking';
import { Reports } from '@/pages/Reports';
import { UserManagement } from '@/pages/UserManagement';
import { MyWorkplace } from '@/pages/MyWorkplace';
import { Profile } from '@/pages/Profile';
import { Settings } from '@/pages/Settings';
import { useAuthStore } from '@/store/authStore';

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="pipeline" element={<SalesPipeline />} />
            <Route path="products" element={<Products />} />
            <Route path="after-sales" element={<AfterSales />} />
            <Route path="debt-collection" element={<DebtCollection />} />
            <Route path="competitors" element={<Competitors />} />
            <Route path="strategies" element={<SalesStrategies />} />
            <Route path="kpi" element={<KPITracking />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="my-workplace" element={<MyWorkplace />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
