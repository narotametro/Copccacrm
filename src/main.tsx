import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Toaster } from 'sonner';

// ========================================
// SERVICE WORKER & CACHE MANAGEMENT
// ========================================

// Force unregister ALL old service workers and clear ALL caches
async function clearAllServiceWorkersAndCaches() {
  try {
    // 1. Unregister ALL service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
    }

    // 2. Delete ALL cache storage
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
  } catch (err) {
    // Silent fail - don't break the app
  }
}

// Check if we need to force refresh (on first load after update)
const BUILD_VERSION = import.meta.env.VITE_BUILD_VERSION || Date.now().toString();
const STORED_VERSION = localStorage.getItem('app_build_version');

if (STORED_VERSION && STORED_VERSION !== BUILD_VERSION) {
  // New build detected - clear everything and force reload
  clearAllServiceWorkersAndCaches().then(() => {
    localStorage.setItem('app_build_version', BUILD_VERSION);
    if (!sessionStorage.getItem('force_reload_done')) {
      sessionStorage.setItem('force_reload_done', 'true');
      window.location.reload();
    }
  });
} else {
  // First visit or same build
  localStorage.setItem('app_build_version', BUILD_VERSION);
}

// Handle chunk loading errors (404 for old JS files)
window.addEventListener('error', (event) => {
  const isChunkError = 
    event.message?.includes('Failed to fetch dynamically imported module') ||
    event.message?.includes('Loading chunk') ||
    event.message?.includes('Failed to load resource') ||
    (event.filename?.includes('.js') && event.message?.includes('404'));
  
  if (isChunkError && !sessionStorage.getItem('chunk_reload_attempted')) {
    // Clear everything and reload
    sessionStorage.setItem('chunk_reload_attempted', 'true');
    clearAllServiceWorkersAndCaches().then(() => {
      window.location.reload();
    });
  }
});

// Clear reload flags on successful load
window.addEventListener('load', () => {
  sessionStorage.removeItem('chunk_reload_attempted');
  sessionStorage.removeItem('force_reload_done');
});

// Apply saved theme on app load
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
  document.body.classList.add('bg-slate-900');
} else if (savedTheme === 'auto') {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    document.documentElement.classList.add('dark');
    document.body.classList.add('bg-slate-900');
  }
}

// Check if root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found!');
}

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
        <Toaster position="top-right" richColors />
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  rootElement.innerHTML = `
    <div style="padding: 40px; font-family: Arial; color: red;">
      <h1>Render Error</h1>
      <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
      <pre>${error instanceof Error ? error.stack : String(error)}</pre>
    </div>
  `;
}
