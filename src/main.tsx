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

// CRITICAL: If new build detected, clear EVERYTHING before app loads
if (STORED_VERSION && STORED_VERSION !== BUILD_VERSION) {
  // New build detected - show update overlay immediately
  const overlay = document.createElement('div');
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    ">
      <div style="text-align: center; max-width: 400px; padding: 40px;">
        <div style="
          width: 80px;
          height: 80px;
          border: 6px solid rgba(255, 255, 255, 0.2);
          border-top: 6px solid white;
          border-radius: 50%;
          margin: 0 auto 32px;
          animation: spin 1s linear infinite;
        "></div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
        <h2 style="font-size: 28px; font-weight: 700; margin-bottom: 12px;">
          New Version Available
        </h2>
        <p style="font-size: 16px; opacity: 0.9; margin-bottom: 24px;">
          Updating to the latest version...
        </p>
        <p style="font-size: 14px; opacity: 0.7;">
          This happens automatically • No action needed
        </p>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  
  // Clear everything synchronously where possible
  try {
    sessionStorage.clear();
  } catch (e) {}
  
  // Clear async caches
  clearAllServiceWorkersAndCaches().then(() => {
    localStorage.setItem('app_build_version', BUILD_VERSION);
    
    // Force hard reload to get fresh content (only once)
    if (!sessionStorage.getItem('hard_reload_done')) {
      sessionStorage.setItem('hard_reload_done', 'true');
      setTimeout(() => window.location.reload(), 1000);
      throw new Error('Reloading for new version'); // Stop execution
    }
  });
} else {
  // First visit or same build - just store version
  localStorage.setItem('app_build_version', BUILD_VERSION);
}

// ========================================
// AUTOMATIC 404 ERROR RECOVERY
// ========================================
// If user somehow gets a 404 error, automatically fix it
// They should NEVER see the error - we catch and fix before they notice

let errorRecoveryInProgress = false;

// Function to show loading overlay during auto-recovery
function showUpdateOverlay(message: string) {
  const overlay = document.createElement('div');
  overlay.id = 'auto-update-overlay';
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    ">
      <div style="text-align: center; max-width: 400px; padding: 40px;">
        <div style="
          width: 80px;
          height: 80px;
          border: 6px solid rgba(255, 255, 255, 0.2);
          border-top: 6px solid white;
          border-radius: 50%;
          margin: 0 auto 32px;
          animation: spin 1s linear infinite;
        "></div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
        <h2 style="font-size: 28px; font-weight: 700; margin-bottom: 12px;">
          ${message}
        </h2>
        <p style="font-size: 16px; opacity: 0.9; margin-bottom: 24px;">
          Getting the latest version for you...
        </p>
        <p style="font-size: 14px; opacity: 0.7;">
          This will only take a moment
        </p>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

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
    
    // Show professional loading overlay (users never see error)
    showUpdateOverlay('Updating App');
    
    // NUCLEAR: Clear everything and force reload
    clearAllServiceWorkersAndCaches().then(() => {
      // Clear version to force fresh start
      localStorage.removeItem('app_build_version');
      sessionStorage.clear();
      
      // Hard reload to get completely fresh content
      setTimeout(() => window.location.reload(), 500);
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
        // If update fails, might be stale - clear and reload
        showUpdateOverlay('Refreshing App');
        clearAllServiceWorkersAndCaches().then(() => {
          setTimeout(() => window.location.reload(), 500);
        });
      });
    }, 30000);
    
    // Listen for new service worker
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker installed - show overlay
            showUpdateOverlay('Installing Update');
            
            // Force immediate activation
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            
            // Reload after 1 second to use new SW
            setTimeout(() => {
              window.location.reload();
            }, 1000);
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
