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
  const initialized = useAuthStore((state) => state.initialized);
  const location = useLocation();

  const roleHierarchy = { admin: 3, manager: 2, user: 1 } as const;
  const effectiveRole = (profile?.role || user?.user_metadata?.role || 'user') as 'admin' | 'manager' | 'user';

  // CRITICAL: Wait for auth initialization to complete
  // Don't redirect users while auth is still loading from localStorage
  // This prevents page shifting during initial load
  if (!initialized) {
    // Auth is still initializing - show nothing (no redirect, no loading spinner)
    // This happens for a split second while checking localStorage
    return null;
  }

  // NOW we can safely check if user is logged in
  if (!user) {
    // User is definitely not logged in - redirect to login
    // DO NOT save redirect path - causes unwanted navigation loops
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    if (!roleHierarchy[effectiveRole] || roleHierarchy[effectiveRole] < roleHierarchy[requiredRole]) {
      return <Navigate to="/app/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
