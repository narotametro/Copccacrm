import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { requestCache } from '../lib/request-cache';

export function PerformanceMonitor() {
  const [stats, setStats] = useState({ cacheSize: 0, pendingRequests: 0 });
  const [show, setShow] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(requestCache.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-hide if no activity
  useEffect(() => {
    if (stats.pendingRequests > 0) {
      setShow(true);
    } else {
      const timeout = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [stats.pendingRequests]);

  if (!show && stats.pendingRequests === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2 text-sm animate-slide-up">
        <Zap size={16} className={stats.pendingRequests > 0 ? 'animate-pulse' : ''} />
        <span>
          {stats.pendingRequests > 0 ? (
            <>Loading {stats.pendingRequests} request{stats.pendingRequests > 1 ? 's' : ''}...</>
          ) : (
            <>Fast! {stats.cacheSize} cached</>
          )}
        </span>
      </div>
    </div>
  );
}
