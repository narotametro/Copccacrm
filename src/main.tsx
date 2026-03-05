import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'sonner';
import { initGlobalErrorHandling, initNetworkMonitoring } from './lib/errorHandling';

// ========================================
// ZERO-ERRORS ERROR HANDLING SYSTEM
// ========================================
// Initialize global error handlers BEFORE anything else
// Users will NEVER see technical errors or 404s - only friendly messages
initGlobalErrorHandling();
initNetworkMonitoring();

// ========================================
// AUTOMATIC ERROR RECOVERY FOR END USERS
// ========================================
// Users should NEVER see 404 errors or need to do anything manually
// This code runs BEFORE the app loads and fixes everything automatically

// Force unregister ALL old service workers and clear ALL caches (AGGRESSIVE)
async function clearAllServiceWorkersAndCaches() {
  try {
    // 1. Unregister ALL service workers immediately
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

// Build version from Vite
const BUILD_VERSION = import.meta.env.VITE_BUILD_VERSION || Date.now().toString();
const STORED_VERSION = localStorage.getItem('app_build_version');

// SILENT UPDATE: If new build detected, prepare in background (NON-DISRUPTIVE)
if (STORED_VERSION && STORED_VERSION !== BUILD_VERSION) {
  // New build detected - clear caches silently in background
  // Users can keep working, update applies on next natural navigation
  clearAllServiceWorkersAndCaches().then(() => {
    localStorage.setItem('app_build_version', BUILD_VERSION);
    localStorage.setItem('update_available', 'true');
    
    // Show small toast notification (non-blocking) - will appear after app loads
    // No forced reload, no full-screen overlay, user keeps working
  });
} else {
  // First visit or same build - just store version
  localStorage.setItem('app_build_version', BUILD_VERSION);
  localStorage.removeItem('update_available');
}

// ========================================
// AUTOMATIC 404 ERROR RECOVERY
// ========================================
// AUTOMATIC 404 ERROR RECOVERY
// ========================================
// If user somehow gets a 404 error, automatically fix it
// They should NEVER see the error - we catch and fix before they notice

let errorRecoveryInProgress = false;

window.addEventListener('error', (event) => {
  // Detect any file loading errors (404, chunk errors, etc.)
  const is404Error = 
    event.message?.includes('Failed to fetch dynamically imported module') ||
    event.message?.includes('Loading chunk') ||
    event.message?.includes('Failed to load resource') ||
    event.message?.includes('404') ||
    (event.filename?.includes('.js') || event.filename?.includes('.css'));
  
  if (is404Error && !errorRecoveryInProgress) {
    errorRecoveryInProgress = true;
    
    // SILENT FIX: Clear caches in background without disrupting user
    clearAllServiceWorkersAndCaches().then(() => {
      // Clear version to force fresh start
      localStorage.removeItem('app_build_version');
      sessionStorage.clear();
      
      // Reload quietly (page should already be loading)
      setTimeout(() => window.location.reload(), 300);
    });
    
    // Prevent error from showing in console (user never sees it)
    event.preventDefault();
  }
}, true); // Capture phase to catch before anything else

// ========================================
// PROACTIVE SERVICE WORKER UPDATE CHECK
// ========================================
// Check for SW updates every 30 seconds - force update immediately

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    // Check for updates every 30 seconds
    setInterval(() => {
      registration.update().catch(() => {
        // If update fails silently, clear and reload without disruption
        clearAllServiceWorkersAndCaches().then(() => {
          setTimeout(() => window.location.reload(), 300);
        });
      });
    }, 30000);
    
    // Listen for new service worker
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker installed - silently activate  
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            
            // Mark update available for next load (non-disruptive)
            localStorage.setItem('update_available', 'true');
          }
        });
      }
    });
  });
}

// Clear reload flags on successful load
window.addEventListener('load', () => {
  sessionStorage.removeItem('hard_reload_done');
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
