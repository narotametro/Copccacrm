/**
 * LOADING STATES - Prevent Broken UI
 * 
 * Users should NEVER see:
 * - Blank screens
 * - Broken layouts
 * - Loading spinners that never complete
 * - Flickering content
 * 
 * Always show beautiful, professional loading states
 */

import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'full';
  text?: string;
  overlay?: boolean;
}

/**
 * Professional loading component
 * Use this instead of raw spinners or "Loading..." text
 */
export function Loading({ size = 'md', text, overlay = false }: LoadingProps) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    full: 'w-16 h-16 border-4',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`
          ${sizes[size]}
          border-gray-200 border-t-purple-600
          rounded-full animate-spin
        `}
      />
      {text && (
        <p className="text-sm text-gray-600 font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  if (size === 'full') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

/**
 * Loading skeleton for list items
 * Shows while data is loading - prevents layout shift
 */
export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse flex space-x-4 p-4 bg-white rounded-lg border border-gray-200"
        >
          <div className="rounded-full bg-gray-200 h-12 w-12" />
          <div className="flex-1 space-y-3 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading card skeleton
 * Shows while card content is loading
 */
export function LoadingCard() {
  return (
    <div className="animate-pulse bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="h-6 bg-gray-200 rounded w-1/3" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  );
}

/**
 * Empty state component
 * Show this instead of blank screens when no data
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      {icon && (
        <div className="text-gray-400 mb-4">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-gray-600 mb-6 max-w-md">
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Error state component with retry
 * Show this when operations fail (but user-friendly!)
 */
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = "Something went wrong", 
  message, 
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-gray-600 mb-6 max-w-md">
        {message}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * Safe content wrapper
 * Automatically shows loading/error/empty states
 * 
 * Usage:
 * <SafeContent loading={loading} error={error} empty={!data?.length}>
 *   <YourContent data={data} />
 * </SafeContent>
 */
interface SafeContentProps {
  loading: boolean;
  error?: { message: string } | null;
  empty?: boolean;
  emptyState?: EmptyStateProps;
  onRetry?: () => void;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export function SafeContent({
  loading,
  error,
  empty,
  emptyState,
  onRetry,
  children,
  loadingComponent,
}: SafeContentProps) {
  // Loading state
  if (loading) {
    return <>{loadingComponent || <LoadingSkeleton />}</>;
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        message={error.message}
        onRetry={onRetry}
      />
    );
  }

  // Empty state
  if (empty) {
    if (emptyState) {
      return <EmptyState {...emptyState} />;
    }
    return (
      <EmptyState
        title="No data found"
        description="There's nothing to display yet."
      />
    );
  }

  // Success - show content
  return <>{children}</>;
}
