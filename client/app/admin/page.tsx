"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, LogOut, Users, Settings, Activity, Clock, AlertTriangle, TrendingUp, CheckCircle2, XCircle, Search, Wrench, MapPin, Sun, Moon } from "lucide-react";
import { 
  getAdminStats, 
  getRecentCrises, 
  getRecentUsers,
  type AdminStats,
  type RecentCrisis,
  type RecentUser
} from "@/lib/admin-api-client";

interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export default function AdminDashboard() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [crisesLoading, setCrisesLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentCrises, setRecentCrises] = useState<RecentCrisis[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

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
      if (!adminUser) return;
      
      setLoading(true);
      
      // Fetch stats with individual loading state
      setStatsLoading(true);
      try {
        console.log('Fetching admin stats...');
        const statsData = await getAdminStats();
        console.log('Admin stats received:', statsData);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        setStats({
          users: { total: 0, active: 0, inactive: 0, admins: 0 },
          system: { total_crises: 0, urgent_alerts: 0, recent_crises: 0, status: 'operational', issues: [] }
        });
      } finally {
        setStatsLoading(false);
      }
      
      // Fetch recent crises with individual loading state
      setCrisesLoading(true);
      try {
        console.log('Fetching recent crises...');
        const crisesData = await getRecentCrises(10);
        console.log('Recent crises received:', crisesData);
        setRecentCrises(crisesData.crises);
      } catch (error) {
        console.error('Failed to fetch recent crises:', error);
        setRecentCrises([]);
      } finally {
        setCrisesLoading(false);
      }
      
      // Fetch users with individual loading state
      setUsersLoading(true);
      try {
        console.log('Fetching recent users...');
        const usersData = await getRecentUsers(5);
        console.log('Recent users received:', usersData);
        setRecentUsers(usersData.users);
      } catch (error) {
        console.error('Failed to fetch recent users:', error);
        setRecentUsers([]);
      } finally {
        setUsersLoading(false);
      }
      
      setLoading(false);
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

  const formatLastLogin = (timeStr: string | null) => {
    if (!timeStr) return "Never";
    return formatActivityTime(timeStr);
  };

  const getStatusBadge = (status: string) => {
    if (status === "operational") {
      return (
        <Badge className="bg-[var(--success-100)] text-[var(--success-800)] border-[var(--success-300)] dark:bg-[var(--success-900)] dark:text-[var(--success-100)] dark:border-[var(--success-700)]">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Operational
        </Badge>
      );
    } else if (status === "degraded") {
      return (
        <Badge className="bg-[var(--warning-100)] text-[var(--warning-800)] border-[var(--warning-300)] dark:bg-[var(--warning-900)] dark:text-[var(--warning-100)] dark:border-[var(--warning-700)]">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Degraded
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-[var(--info-100)] text-[var(--info-800)] border-[var(--info-300)] dark:bg-[var(--info-900)] dark:text-[var(--info-100)] dark:border-[var(--info-700)]">
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
          <div className="flex items-center space-x-3">
            <Logo size="default" />
            <span className="text-xl font-bold">BlueRelief Admin</span>
            <Badge variant="default" className="bg-primary text-primary-foreground shadow-md border border-primary/20">
              <Shield className="w-3 h-3 mr-1" />
              Administrator
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const currentTheme = theme || "system";
                if (currentTheme === "dark") {
                  setTheme("light");
                } else if (currentTheme === "light") {
                  setTheme("dark");
                } else {
                  // If system, toggle to opposite of current resolved theme
                  const isDark = document.documentElement.classList.contains("dark");
                  setTheme(isDark ? "light" : "dark");
                }
              }}
              aria-label="Toggle theme"
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
            <Button variant="outline" onClick={handleLogout} aria-label="Log out from admin dashboard">
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Logout
            </Button>
          </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" role="region" aria-label="Dashboard statistics">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {statsLoading ? (
                    <>
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-4 w-20" />
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold" aria-label={`Total users: ${stats?.users.total || 0}`}>
                        {stats?.users.total || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Users</div>
                    </>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                  <Users className="text-primary h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[var(--chart-2)]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {statsLoading ? (
                    <>
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold" aria-label={`Active admins: ${stats?.users.admins || 0}`}>
                        {stats?.users.admins || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Active Admins</div>
                    </>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-[var(--chart-2)]/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                  <Shield className="text-[var(--chart-2)] h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[var(--warning-500)]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {statsLoading ? (
                    <>
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold" aria-label={`Urgent alerts: ${stats?.system.urgent_alerts || 0}`}>
                        {stats?.system.urgent_alerts || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Urgent Alerts</div>
                    </>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-[var(--warning-500)]/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                  <AlertTriangle className="text-[var(--warning-500)] h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[var(--chart-3)]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {statsLoading ? (
                    <>
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-4 w-28" />
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold" aria-label={`Recent crises: ${stats?.system.recent_crises || 0}`}>
                        {stats?.system.recent_crises || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Recent Crises</div>
                    </>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-[var(--chart-3)]/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                  <AlertTriangle className="text-[var(--chart-3)] h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Crises Feed */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recent Crises
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="space-y-2 max-h-[320px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent" 
                role="list" 
                aria-label="Recent crises"
              >
                {crisesLoading ? (
                  <>
                    {[...Array(5)].map((_, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </>
                ) : recentCrises.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm" role="status">
                    No recent crises detected
                  </div>
                ) : (
                  recentCrises.map((crisis) => (
                    <div
                      key={crisis.id}
                      role="listitem"
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        crisis.severity_level >= 4 ? 'bg-[var(--destructive)]/10' :
                        crisis.severity_level >= 3 ? 'bg-[var(--warning-500)]/10' :
                        'bg-primary/10'
                      }`} aria-hidden="true">
                        <AlertTriangle className={`h-4 w-4 ${
                          crisis.severity_level >= 4 ? 'text-[var(--destructive)]' :
                          crisis.severity_level >= 3 ? 'text-[var(--warning-500)]' :
                          'text-primary'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium truncate">
                            {crisis.description.length > 60 ? `${crisis.description.substring(0, 60)}...` : crisis.description}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs border ${
                              crisis.severity.toLowerCase() === 'critical' 
                                ? '!bg-red-500/10 !text-red-700 dark:!bg-red-950/50 dark:!text-red-300'
                                : crisis.severity.toLowerCase() === 'high'
                                ? '!bg-orange-500/10 !text-orange-700 dark:!bg-orange-950/50 dark:!text-orange-300'
                                : crisis.severity.toLowerCase() === 'medium'
                                ? '!bg-yellow-500/10 !text-yellow-700 dark:!bg-yellow-950/50 dark:!text-yellow-300'
                                : crisis.severity.toLowerCase() === 'low'
                                ? '!bg-green-500/10 !text-green-700 dark:!bg-green-950/50 dark:!text-green-300'
                                : '!bg-blue-500/10 !text-blue-700 dark:!bg-blue-950/50 dark:!text-blue-300'
                            }`}
                          >
                            {crisis.severity}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {crisis.location_name && (
                            <>
                              <MapPin className="h-3 w-3" aria-hidden="true" />
                              <span>{crisis.location_name}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{formatActivityTime(crisis.event_time || crisis.extracted_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="self-start">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-4" role="region" aria-label="System status">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Overall Status</span>
                    {statsLoading ? (
                      <Skeleton className="h-5 w-24" />
                    ) : (
                      stats && getStatusBadge(stats.system.status)
                    )}
                  </div>
                </div>
                <div className="space-y-3" role="list" aria-label="System metrics">
                  <div className="flex items-center justify-between" role="listitem">
                    <span className="text-sm text-muted-foreground">Total Crises</span>
                    <span className="text-sm font-medium">
                      {statsLoading ? <Skeleton className="h-4 w-8 inline-block" /> : (stats?.system.total_crises || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between" role="listitem">
                    <span className="text-sm text-muted-foreground">Active Users</span>
                    <span className="text-sm font-medium">
                      {statsLoading ? <Skeleton className="h-4 w-8 inline-block" /> : (stats?.users.active || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between" role="listitem">
                    <span className="text-sm text-muted-foreground">Inactive Users</span>
                    <span className="text-sm font-medium">
                      {statsLoading ? <Skeleton className="h-4 w-8 inline-block" /> : (stats?.users.inactive || 0)}
                    </span>
                  </div>
                </div>
                {statsLoading ? null : (
                  <div className="pt-3 border-t">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Database</span>
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-[var(--success-600)] dark:bg-[var(--success-400)]" aria-hidden="true" />
                          <span className="text-muted-foreground">Connected</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">API Status</span>
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-[var(--success-600)] dark:bg-[var(--success-400)]" aria-hidden="true" />
                          <span className="text-muted-foreground">Online</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {statsLoading ? null : stats?.system.issues && stats.system.issues.length > 0 && (
                  <div className="pt-3 border-t" role="alert" aria-label="System issues">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Issues:</div>
                    <div className="space-y-1">
                      {stats.system.issues.map((issue: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-[var(--warning-600)] dark:text-[var(--warning-400)]">
                          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recent Users
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  <Input
                    placeholder="Search users..."
                    className="pl-8 h-8 w-full sm:w-[180px] text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search users"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2" role="list" aria-label="Recent users">
                {usersLoading ? (
                  <>
                    {[...Array(3)].map((_, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm" role="status">
                    {searchQuery ? "No users found matching your search" : "No users found"}
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      role="listitem"
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{user.email}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.name || "No name"} • {user.role}
                          {user.is_admin && " • Admin"}
                        </div>
                        {user.last_login && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Last login: {formatLastLogin(user.last_login)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {user.last_login ? (
                          <Badge variant="outline" className="text-xs" aria-label="Active user">
                            <CheckCircle2 className="w-3 h-3 mr-1" aria-hidden="true" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs" aria-label="Inactive user">
                            <XCircle className="w-3 h-3 mr-1" aria-hidden="true" />
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
                  onClick={() => router.push('/admin/users')}
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
                   onClick={() => router.push('/admin/logs')}
                 >
                   <Activity className="mr-2 h-4 w-4" />
                   <div className="text-left">
                     <div className="font-medium">Admin Log Viewer</div>
                     <div className="text-xs text-muted-foreground">View detailed admin logs</div>
                   </div>
                 </Button>
                <Button 
                  className="justify-start h-auto py-3" 
                  variant="outline"
                  onClick={() => router.push('/admin/dev-tools')}
                >
                  <Wrench className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Dev Tools</div>
                    <div className="text-xs text-muted-foreground">Developer tools and utilities</div>
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
