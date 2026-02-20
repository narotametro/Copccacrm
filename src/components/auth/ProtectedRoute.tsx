import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LoadingPage } from '@/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'manager' | 'user';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.loading);
  const location = useLocation();

  const roleHierarchy = { admin: 3, manager: 2, user: 1 } as const;
  const effectiveRole = (profile?.role || user?.user_metadata?.role || 'user') as 'admin' | 'manager' | 'user';

  if (loading) {
    return <LoadingPage />;
  }

  if (!user) {
    // Save the current path before redirecting to login
    localStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requiredRole) {
    if (!roleHierarchy[effectiveRole] || roleHierarchy[effectiveRole] < roleHierarchy[requiredRole]) {
      return <Navigate to="/app/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
