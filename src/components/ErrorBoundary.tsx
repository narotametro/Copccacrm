import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global Error Boundary - Catches ALL React crashes
 * Users NEVER see technical errors or blank screens
 * Automatically recovers by clearing state and reloading
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render shows the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development only
    if (import.meta.env.DEV) {
      console.error('Error Boundary caught:', error, errorInfo);
    }

    // In production, automatically recover after showing brief message
    if (import.meta.env.PROD) {
      setTimeout(() => {
        // Clear all stored state that might be corrupted
        try {
          const keysToPreserve = ['supabase.auth.token'];
          const storageSnapshot: { [key: string]: string } = {};
          
          // Preserve authentication
          keysToPreserve.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) storageSnapshot[key] = value;
          });

          // Clear potentially corrupted state
          localStorage.clear();
          sessionStorage.clear();

          // Restore authentication
          Object.entries(storageSnapshot).forEach(([key, value]) => {
            localStorage.setItem(key, value);
          });

          // Reload page to reset app state
          window.location.reload();
        } catch (e) {
          // If clearing storage fails, just reload
          window.location.reload();
        }
      }, 2000);
    }
  }

  render() {
    if (this.state.hasError) {
      // Production: Show beautiful, non-technical recovery screen
      return (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.98)',
              borderRadius: '20px',
              padding: '48px',
              maxWidth: '500px',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Spinning loader */}
            <div
              style={{
                width: '64px',
                height: '64px',
                border: '4px solid #e5e7eb',
                borderTop: '4px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 24px',
              }}
            />
            
            <h2
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '16px',
              }}
            >
              Refreshing Your Experience
            </h2>
            
            <p
              style={{
                fontSize: '16px',
                color: '#6b7280',
                lineHeight: '1.6',
                marginBottom: '8px',
              }}
            >
              We're optimizing your workspace for the best experience.
            </p>
            
            <p
              style={{
                fontSize: '14px',
                color: '#9ca3af',
                fontWeight: '500',
              }}
            >
              This happens automatically • No action needed
            </p>

            {/* Add keyframes for spin animation */}
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
