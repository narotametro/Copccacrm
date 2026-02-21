import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Toaster } from 'sonner';

// Handle chunk loading errors globally (auto-reload on new deployment)
window.addEventListener('error', (event) => {
  const isChunkError = 
    event.message?.includes('Failed to fetch dynamically imported module') ||
    event.message?.includes('Loading chunk') ||
    event.filename?.includes('.js');
  
  if (isChunkError && !sessionStorage.getItem('chunk_reload_attempted')) {
    console.log('Chunk load error detected. Reloading to fetch new build...');
    sessionStorage.setItem('chunk_reload_attempted', 'true');
    window.location.reload();
  }
});

// Clear reload flag on successful load
window.addEventListener('load', () => {
  // Immediately clear flag on successful load
  sessionStorage.removeItem('chunk_reload_attempted');
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
