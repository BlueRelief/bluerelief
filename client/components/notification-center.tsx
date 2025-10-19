'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface Alert {
  id: number;
  title: string;
  message: string;
  severity: number;
  alert_type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationCenterProps {
  userId: string;
}

export function NotificationCenter({ userId }: NotificationCenterProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [userId]);

  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient(`/api/alerts/unread-count?user_id=${userId}`);
      const data = await response.json();
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await apiClient(`/api/alerts?user_id=${userId}&skip=0&limit=10`);
      const data = await response.json();
      setAlerts(data || []);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && alerts.length === 0) {
      fetchAlerts();
    }
  };

  const handleMarkAsRead = async (alertId: number) => {
    try {
      await apiClient(`/api/alerts/${alertId}/read?user_id=${userId}`, {
        method: 'PUT',
      });
      fetchUnreadCount();
      fetchAlerts();
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 5:
        return 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200';
      case 4:
        return 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-200';
      case 3:
        return 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200';
      default:
        return 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0">
        <div className="space-y-0">
          <div className="p-4 border-b dark:border-slate-700">
            <h2 className="font-semibold text-lg text-foreground">Alerts</h2>
            <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : alerts.length > 0 ? (
              <div className="space-y-0">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition"
                    onClick={() => handleMarkAsRead(alert.id)}
                  >
                    <div className="flex gap-3">
                      <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-1 ${alert.severity >= 4 ? 'text-red-600' : alert.severity === 3 ? 'text-yellow-600' : 'text-blue-600'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm line-clamp-1 text-foreground">{alert.title}</p>
                          {!alert.is_read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(alert.severity)}`}>
                            Severity {alert.severity}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatTime(alert.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">No alerts yet</p>
              </div>
            )}
          </div>

          {alerts.length > 0 && (
            <div className="p-4 border-t dark:border-slate-700">
              <Link href="/dashboard/alerts">
                <Button variant="outline" className="w-full" size="sm">
                  View All Alerts
                </Button>
              </Link>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
