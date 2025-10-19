"use client"

import { useState, useEffect } from "react";
import { Search, ExternalLink, Calendar, MapPin, User, Loader2, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

interface Alert {
  id: number;
  title: string;
  message: string;
  severity: number;
  alert_type: string;
  is_read: boolean;
  created_at: string;
  disaster_id?: number;
  alert_metadata?: Record<string, unknown>;
}

export default function AlertsPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user?.user_id) {
      fetchAlerts();
    }
  }, [user?.user_id, authLoading]);

  const fetchAlerts = async () => {
    if (!user?.user_id) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient(
        `/api/alerts?user_id=${user.user_id}&skip=0&limit=100`
      );
      const data = await response.json();
      setAlerts(data || []);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter(alert =>
    alert.alert_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alert.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSeverityLabel = (severity: number) => {
    if (severity >= 4) return "High Risk";
    if (severity === 3) return "Medium Risk";
    return "Low Risk";
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return "destructive";
    if (severity === 3) return "secondary";
    return "outline";
  };

  const getAlertIcon = (severity: number) => {
    if (severity >= 4) {
      return (
        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-lg">!</span>
        </div>
      );
    } else if (severity === 3) {
      return (
        <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-black font-bold text-lg">!</span>
        </div>
      );
    } else {
      return (
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-lg">!</span>
        </div>
      );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading alerts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Error loading alerts</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alerts</h1>
          <p className="text-muted-foreground mt-1">Real-time crisis alerts for your location</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80 bg-card border-border"
            />
          </div>
          <Link href="/dashboard/settings">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              Manage Preferences
            </Button>
          </Link>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-6">
        {filteredAlerts.map((alert) => (
          <Card key={alert.id} className="bg-card border-border shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start space-x-4">
                {getAlertIcon(alert.severity)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-2xl font-bold text-card-foreground uppercase tracking-wide">
                        {alert.alert_type}
                      </h3>
                      <Badge 
                        variant={getSeverityColor(alert.severity) as any}
                        className="text-sm px-3 py-1"
                      >
                        {getSeverityLabel(alert.severity)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {formatTimestamp(alert.created_at)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(alert.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-foreground">{alert.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <Separator className="mx-6 dark:opacity-20" />
            
            <CardContent className="pt-6">
              <div className="bg-muted/50 dark:bg-slate-900/50 rounded-lg p-4 border border-border dark:border-slate-700">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-foreground">Status</span>
                    </div>
                    <Badge variant={alert.is_read ? "secondary" : "destructive"} className="text-xs">
                      {alert.is_read ? "Read" : "Unread"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {formatTimestamp(alert.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAlerts.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {alerts.length === 0 ? "No alerts yet" : "No alerts found"}
          </h3>
          <p className="text-muted-foreground">
            {alerts.length === 0 
              ? "You'll receive alerts for crises within 100km of your location"
              : "Try adjusting your search terms or check back later for new alerts."
            }
          </p>
        </div>
      )}
    </div>
  );
}
