import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingContextType {
  isGlobalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  loadingMessage: string;
  setLoadingMessage: (message: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [loadingMessage, setLoadingMessageState] = useState('Loading...');

  const setGlobalLoading = (loading: boolean) => {
    setIsGlobalLoading(loading);
  };

  const setLoadingMessage = (message: string) => {
    setLoadingMessageState(message);
  };

  return (
    <LoadingContext.Provider value={{ isGlobalLoading, setGlobalLoading, loadingMessage, setLoadingMessage }}>
      {isGlobalLoading && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 animate-pulse"></div>
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-4 py-2 text-center text-sm text-gray-700 shadow-sm">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-pink-500"></div>
              {loadingMessage}
            </div>
          </div>
        </div>
      )}
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
