import React, { useEffect, useState } from 'react';

/**
 * AutoUpdateOverlay - Shows when app is auto-updating after detecting new version
 * Users see a brief professional loading screen instead of errors
 * Completely automatic - no user interaction required
 */
export function AutoUpdateOverlay() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Listen for update events from main.tsx
    const handleUpdate = () => {
      setIsUpdating(true);
      
      // Simulate progress for better UX
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.random() * 15;
        if (currentProgress > 90) currentProgress = 90;
        setProgress(currentProgress);
      }, 100);

      // Clean up after 5 seconds (reload should happen before this)
      setTimeout(() => {
        clearInterval(interval);
        setProgress(100);
      }, 5000);
    };

    // Check if we're in update mode
    if (sessionStorage.getItem('app_updating') === 'true') {
      handleUpdate();
    }

    window.addEventListener('app-updating', handleUpdate);
    return () => window.removeEventListener('app-updating', handleUpdate);
  }, []);

  if (!isUpdating) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        color: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '400px', padding: '40px' }}>
        {/* Loading Spinner */}
        <div
          style={{
            width: '80px',
            height: '80px',
            border: '6px solid rgba(255, 255, 255, 0.2)',
            borderTop: '6px solid white',
            borderRadius: '50%',
            margin: '0 auto 32px',
            animation: 'spin 1s linear infinite',
          }}
        />

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>

        {/* Title */}
        <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px' }}>
          Updating to Latest Version
        </h2>

        {/* Subtitle */}
        <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '24px' }}>
          Getting the newest features for you...
        </p>

        {/* Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'white',
              borderRadius: '4px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Progress Text */}
        <p style={{ fontSize: '14px', opacity: 0.7 }}>
          {progress < 30 && 'Checking for updates...'}
          {progress >= 30 && progress < 60 && 'Downloading new version...'}
          {progress >= 60 && progress < 90 && 'Installing updates...'}
          {progress >= 90 && 'Almost ready...'}
        </p>

        {/* Auto-reload notice */}
        <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '16px' }}>
          This will only take a moment
        </p>
      </div>
    </div>
  );
}
