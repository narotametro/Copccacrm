import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

/**
 * Auto-update notifier - HubSpot/QuickBooks style
 * Detects new versions and prompts user to reload (or auto-reloads)
 */
export const UpdateNotifier = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('✅ Service Worker registered');
      // Check for updates every 60 seconds (like HubSpot)
      if (r) {
        setInterval(() => {
          r.update();
        }, 60000);
      }
    },
    onRegisterError(error) {
      console.error('❌ Service Worker registration error:', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      // Show persistent toast with update button
      toast.info('New version available!', {
        icon: <RefreshCw className="h-4 w-4" />,
        description: 'Click to update and get the latest features',
        duration: Infinity, // Don't auto-dismiss
        action: {
          label: 'Update Now',
          onClick: () => {
            setNeedRefresh(false);
            updateServiceWorker(true); // Force update and reload
          },
        },
      });
    }
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  return null; // This component has no UI, just side effects
};
