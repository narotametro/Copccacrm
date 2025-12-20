import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

export function PerformanceIndicator() {
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Measure page load time
    if (typeof window !== 'undefined' && window.performance) {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      setLoadTime(Math.round(pageLoadTime / 1000 * 10) / 10); // Round to 1 decimal
    }

    // Hide after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible || loadTime === null) return null;

  const getPerformanceLevel = (time: number) => {
    if (time < 1) return { level: 'Excellent', color: 'bg-green-500', emoji: '⚡' };
    if (time < 2) return { level: 'Good', color: 'bg-blue-500', emoji: '🚀' };
    if (time < 3) return { level: 'Fair', color: 'bg-yellow-500', emoji: '⏱️' };
    return { level: 'Slow', color: 'bg-red-500', emoji: '🐌' };
  };

  const perf = getPerformanceLevel(loadTime);

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500"
      style={{
        animation: isVisible ? 'slideIn 0.5s ease-out' : 'slideOut 0.5s ease-out forwards'
      }}
    >
      <div className={`${perf.color} text-white rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[200px]`}>
        <div className="text-2xl">{perf.emoji}</div>
        <div>
          <div className="text-xs opacity-90">Page Load Time</div>
          <div className="text-lg font-semibold">{loadTime}s</div>
          <div className="text-xs opacity-90">{perf.level} Performance</div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-2 hover:bg-white/20 rounded p-1 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
