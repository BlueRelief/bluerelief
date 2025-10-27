import { useEffect, useState, useCallback } from 'react';
import { CrisisAlert, showCrisisAlert, ALERT_SEVERITY } from '@/lib/toast-utils';
import { apiGet } from '@/lib/api-client';

interface UseAlertNotificationsProps {
  userId?: number;
  enabled?: boolean;
}

export const useAlertNotifications = ({ userId, enabled = true }: UseAlertNotificationsProps) => {
  const [lastAlertCount, setLastAlertCount] = useState(0);
  const [alerts, setAlerts] = useState<CrisisAlert[]>([]);

  const fetchAlerts = useCallback(async () => {
    if (!userId || !enabled) return;

    try {
      const data = await apiGet<CrisisAlert[]>(`/api/alerts?user_id=${userId}&skip=0&limit=10`);
      
      if (Array.isArray(data)) {
        setAlerts(data);
        
        // Check for new alerts
        if (data.length > lastAlertCount && lastAlertCount > 0) {
          const newAlerts = data.slice(0, data.length - lastAlertCount);
          newAlerts.forEach(alert => {
            // Only show toast for high severity alerts
            if (alert.severity >= ALERT_SEVERITY.HIGH) {
              showCrisisAlert(alert);
            }
          });
        }
        
        setLastAlertCount(data.length);
      }
    } catch (error) {
      console.error('Failed to fetch alerts for notifications:', error);
    }
  }, [userId, enabled, lastAlertCount]);

  useEffect(() => {
    if (!enabled || !userId) return;

    // Initial fetch
    fetchAlerts();

    // Set up polling for new alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);

    return () => clearInterval(interval);
  }, [fetchAlerts, enabled, userId]);

  return {
    alerts,
    fetchAlerts,
  };
};
