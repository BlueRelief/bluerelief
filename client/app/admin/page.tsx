"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, LogOut, Users, Settings, Activity, Clock, AlertTriangle, TrendingUp, CheckCircle2, XCircle, Search } from "lucide-react";
import { getAdminStats, getRecentAdminActivities, getRecentUsers } from "@/lib/admin-api-client";

interface AdminUser {
  id: string;
  email: string;
  role: string;
}

interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    admins: number;
  };
  system: {
    total_crises: number;
    urgent_alerts: number;
    recent_activities: number;
    status: string;
    issues: string[];
  };
}

interface AdminActivity {
  admin_id: string | null;
  action: string;
  target_user_id: string | null;
  details: any;
  created_at: string | null;
  admin_email: string | null;
}

interface RecentUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_admin: boolean;
  created_at: string | null;
  last_login: string | null;
}

export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const userStr = localStorage.getItem('admin_user') || sessionStorage.getItem('admin_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setAdminUser(user);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch data with individual error handling to prevent any single failure from breaking the UI
        try {
          const statsData = await getAdminStats();
          setStats(statsData);
        } catch (error) {
          // Silently use default stats
          setStats({
            users: { total: 0, active: 0, inactive: 0, admins: 0 },
            system: { total_crises: 0, urgent_alerts: 0, recent_activities: 0, status: 'operational', issues: [] }
          });
        }
        
        try {
          const activitiesData = await getRecentAdminActivities(10);
          setActivities(activitiesData.activities);
        } catch (error) {
          // Silently use empty activities
          setActivities([]);
        }
        
        try {
          const usersData = await getRecentUsers(5);
          setRecentUsers(usersData.users);
        } catch (error) {
          // Silently use empty users
          setRecentUsers([]);
        }
        
      } catch (error) {
        // Final fallback - shouldn't reach here with individual try-catch above
        setStats({
          users: { total: 0, active: 0, inactive: 0, admins: 0 },
          system: { total_crises: 0, urgent_alerts: 0, recent_activities: 0, status: 'operational', issues: [] }
        });
        setActivities([]);
        setRecentUsers([]);
      } finally {
        setLoading(false);
      }
    };

    if (adminUser) {
      fetchDashboardData();
    }
  }, [adminUser]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    sessionStorage.removeItem('admin_user');
    router.push('/admin/login');
  };

  const formatActivityTime = (timeStr: string | null) => {
    if (!timeStr) return "Just now";
    const date = new Date(timeStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusBadge = (status: string) => {
    if (status === "operational") {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-700">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Operational
        </Badge>
      );
    } else if (status === "degraded") {
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-100 dark:border-amber-700">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Degraded
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700">
          <Clock className="w-3 h-3 mr-1" />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    }
  };

  const filteredUsers = recentUsers.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading && !adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Logo size="default" />
            <span className="text-xl font-bold">BlueRelief Admin</span>
            <Badge variant="default" className="ml-2 bg-primary border-2 border-foreground">
              <Shield className="w-3 h-3 mr-1" />
              Administrator
            </Badge>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          {adminUser && (
            <p className="text-muted-foreground">
              Welcome back, <span className="font-semibold">{adminUser.email}</span>
            </p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {loading ? "-" : stats?.users.total || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Users</div>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="text-primary h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[var(--chart-2)]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {loading ? "-" : stats?.users.admins || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Active Admins</div>
                </div>
                <div className="h-12 w-12 rounded-full bg-[var(--chart-2)]/10 flex items-center justify-center">
                  <Shield className="text-[var(--chart-2)] h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {loading ? "-" : stats?.system.urgent_alerts || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Urgent Alerts</div>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="text-amber-500 h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[var(--chart-3)]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {loading ? "-" : stats?.system.recent_activities || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Recent Activities</div>
                </div>
                <div className="h-12 w-12 rounded-full bg-[var(--chart-3)]/10 flex items-center justify-center">
                  <Activity className="text-[var(--chart-3)] h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity Feed */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Loading activities...
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No recent activities
                  </div>
                ) : (
                  activities.map((activity, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {activity.admin_email || "System"}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {activity.action}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatActivityTime(activity.created_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Overall Status</span>
                    {stats && getStatusBadge(stats.system.status)}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Crises</span>
                    <span className="text-sm font-medium">
                      {loading ? "-" : stats?.system.total_crises || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Users</span>
                    <span className="text-sm font-medium">
                      {loading ? "-" : stats?.users.active || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Inactive Users</span>
                    <span className="text-sm font-medium">
                      {loading ? "-" : stats?.users.inactive || 0}
                    </span>
                  </div>
                </div>
                {stats?.system.issues && stats.system.issues.length > 0 && (
                  <div className="pt-3 border-t">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Issues:</div>
                    <div className="space-y-1">
                      {stats.system.issues.map((issue, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-3 w-3" />
                          {issue}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & User Management */}
        <div className="grid gap-6 lg:grid-cols-2 mt-6">
          {/* User Management Preview */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recent Users
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-8 h-8 w-[180px] text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Loading users...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No users found
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{user.email}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.name || "No name"} • {user.role}
                          {user.is_admin && " • Admin"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.last_login ? (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  className="justify-start h-auto py-3" 
                  variant="outline"
                  onClick={() => router.push('/admin')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Manage Users</div>
                    <div className="text-xs text-muted-foreground">View and manage all users</div>
                  </div>
                </Button>
                <Button 
                  className="justify-start h-auto py-3" 
                  variant="outline"
                  onClick={() => router.push('/admin')}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Admin Settings</div>
                    <div className="text-xs text-muted-foreground">Configure system settings</div>
                  </div>
                </Button>
                <Button 
                  className="justify-start h-auto py-3" 
                  variant="outline"
                  onClick={() => router.push('/admin')}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Activity Logs</div>
                    <div className="text-xs text-muted-foreground">View detailed activity logs</div>
                  </div>
                </Button>
                <Button 
                  className="justify-start h-auto py-3" 
                  variant="outline"
                  onClick={() => router.push('/admin')}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Domain Config</div>
                    <div className="text-xs text-muted-foreground">Manage allowed domains</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
