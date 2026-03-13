import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global Error Boundary - Catches React crashes gracefully
 * Silently recovers without disrupting user experience
 * No page reloads, no logouts, no redirects
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
    // Log but don't disrupt - error will auto-clear
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console for debugging
    if (import.meta.env.DEV) {
      console.error('Error Boundary caught:', error, errorInfo);
    }

    // Silently recover - reset error state immediately
    // Users stay exactly where they were, no disruption
    setTimeout(() => {
      this.setState({ hasError: false, error: null });
    }, 50);
  }

  render() {
    // Always render children - even during brief error state
    // This prevents blank screens and maintains user context
    return this.props.children;
  }
}

export default ErrorBoundary;
