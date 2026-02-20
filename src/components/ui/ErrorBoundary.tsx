import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Detect chunk loading errors (after deployment with new build)
    const isChunkLoadError = 
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('ChunkLoadError');
    
    if (isChunkLoadError) {
      // Check if we've already tried reloading to prevent infinite loops
      const hasReloadedForChunk = sessionStorage.getItem('chunk_reload_attempted');
      
      if (!hasReloadedForChunk) {
        console.log('Chunk load error detected. Reloading page to fetch new chunks...');
        sessionStorage.setItem('chunk_reload_attempted', 'true');
        window.location.reload();
      } else {
        // Clear the flag after showing error (user can manually reload)
        sessionStorage.removeItem('chunk_reload_attempted');
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      const isChunkError = 
        this.state.error?.message?.includes('Failed to fetch dynamically imported module') ||
        this.state.error?.message?.includes('Loading chunk') ||
        this.state.error?.message?.includes('ChunkLoadError');

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="glass rounded-xl p-8 max-w-md text-center">
            <AlertCircle className="mx-auto text-red-600 mb-4" size={48} />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {isChunkError ? 'Update Available' : 'Something went wrong'}
            </h1>
            <p className="text-slate-600 mb-6">
              {isChunkError 
                ? 'A new version is available. Please reload the page to get the latest updates.' 
                : (this.state.error?.message || 'An unexpected error occurred')}
            </p>
            <Button onClick={() => {
              sessionStorage.removeItem('chunk_reload_attempted');
              window.location.reload();
            }}>
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
