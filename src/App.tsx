import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { COPCCAProtectedRoute } from '@/components/auth/COPCCAProtectedRoute';
import { COPCCAAdminLayout } from '@/components/layout/COPCCAAdminLayout';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { SharedDataProvider } from '@/context/SharedDataContext';

// Lazy load all page components for instant loading
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register').then(module => ({ default: module.Register })));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword').then(module => ({ default: module.ResetPassword })));
const COPCCAAdminLogin = lazy(() => import('@/pages/auth/COPCCAAdminLogin').then(module => ({ default: module.COPCCAAdminLogin })));
const AcceptInvite = lazy(() => import('@/pages/auth/AcceptInvite').then(module => ({ default: module.AcceptInvite })));

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Customers = lazy(() => import('@/pages/Customers').then(module => ({ default: module.Customers })));
const CustomerDetailPage = lazy(() => import('@/pages/CustomerDetailPage').then(module => ({ default: module.CustomerDetailPage })));
const Sales = lazy(() => import('@/pages/Sales').then(module => ({ default: module.Sales })));
const SalesHub = lazy(() => import('@/pages/SalesHub'));
const AfterSales = lazy(() => import('@/pages/AfterSales').then(module => ({ default: module.AfterSales })));
const DebtCollection = lazy(() => import('@/pages/DebtCollection').then(module => ({ default: module.DebtCollection })));
const Competitors = lazy(() => import('@/pages/Competitors').then(module => ({ default: module.Competitors })));
const Marketing = lazy(() => import('@/pages/Marketing').then(module => ({ default: module.Marketing })));
const KPITracking = lazy(() => import('@/pages/KPITracking').then(module => ({ default: module.KPITracking })));
const Reports = lazy(() => import('@/pages/Reports').then(module => ({ default: module.Reports })));
const UserManagement = lazy(() => import('@/pages/UserManagement').then(module => ({ default: module.UserManagement })));
const Products = lazy(() => import('@/pages/Products').then(module => ({ default: module.Products })));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage').then(module => ({ default: module.ProductDetailPage })));
const CompetitorDetailPage = lazy(() => import('@/pages/CompetitorDetailPage').then(module => ({ default: module.CompetitorDetailPage })));
const Profile = lazy(() => import('@/pages/Profile').then(module => ({ default: module.Profile })));
const Settings = lazy(() => import('@/pages/Settings').then(module => ({ default: module.Settings })));
const MyWorkplace = lazy(() => import('@/pages/MyWorkplace').then(module => ({ default: module.MyWorkplace })));
const LandingPage = lazy(() => import('@/pages/LandingPage').then(module => ({ default: module.LandingPage })));
const PricingPage = lazy(() => import('@/pages/PricingPage').then(module => ({ default: module.PricingPage })));
const Notifications = lazy(() => import('@/pages/Notifications').then(module => ({ default: module.Notifications })));
const InvoiceDashboard = lazy(() => import('@/pages/InvoiceDashboard'));
const Invoices = lazy(() => import('@/pages/Invoices'));
const CreateInvoice = lazy(() => import('@/pages/CreateInvoice'));
const InvoiceDetail = lazy(() => import('@/pages/InvoiceDetail'));
const Pipeline = lazy(() => import('@/pages/Pipeline').then(module => ({ default: module.Pipeline })));

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AdminCompanies = lazy(() => import('@/pages/admin/AdminCompanies').then(module => ({ default: module.AdminCompanies })));
const AdminSubscriptions = lazy(() => import('@/pages/admin/AdminSubscriptions').then(module => ({ default: module.AdminSubscriptions })));
const AdminSystem = lazy(() => import('@/pages/admin/AdminSystem').then(module => ({ default: module.AdminSystem })));

// Instant loading component
const InstantLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
    <div className="text-center">
      <div className="animate-pulse">
        <div className="w-12 h-12 bg-primary-200 rounded-full mx-auto mb-4"></div>
      </div>
      <p className="text-slate-600 text-sm">Loading...</p>
    </div>
  </div>
);

// Preload critical routes for instant navigation
const preloadCriticalRoutes = () => {
  // Only preload the most essential pages to avoid blocking
  setTimeout(() => import('@/pages/Dashboard'), 500);
  setTimeout(() => import('@/pages/Customers'), 1000);
  // Don't preload SalesHub immediately as it's heavy
};

const AppRoutes = () => {
  const { user, loading } = useAuthStore();
  const [maxLoadingReached, setMaxLoadingReached] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setMaxLoadingReached(true);
      }
    }, 500); // Reduced from 1500ms to 500ms for faster loading
    return () => clearTimeout(timer);
  }, [loading]);

  // Preload critical routes after authentication
  useEffect(() => {
    if (user && !loading) {
      // Small delay to not block initial render
      setTimeout(preloadCriticalRoutes, 100);
    }
  }, [user, loading]);
  
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
    <Suspense fallback={<InstantLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
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
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="sales" element={<Sales />} />
          <Route path="sales-hub" element={<SalesHub />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="after-sales" element={<AfterSales />} />
          <Route path="debt-collection" element={<DebtCollection />} />
          <Route path="competitors" element={<Competitors />} />
          <Route path="competitors/:id" element={<CompetitorDetailPage />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="kpi-tracking" element={<KPITracking />} />
          <Route path="reports" element={<Reports />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/dashboard" element={<InvoiceDashboard />} />
          <Route path="invoices/create" element={<CreateInvoice />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />
          <Route path="invoices/:id/edit" element={<CreateInvoice />} />
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

        {/* Catch-all: Redirect to login or dashboard - but not for admin routes */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </Suspense>
  );
};

// Restore requested path BEFORE React Router initializes
const requestedPath = sessionStorage.getItem('requested_path');
if (requestedPath && requestedPath !== window.location.pathname) {
  sessionStorage.removeItem('requested_path');
  window.history.replaceState(null, '', requestedPath);
}

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
