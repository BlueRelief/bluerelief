"use client"

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Logo } from "@/components/logo";
import { NotificationCenter } from "@/components/notification-center";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  LogOut,
  Sun,
  Moon,
  Monitor,
  Activity,
  MapPin,
  ChevronUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Lordicon } from "@/components/lordicon";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { logout } from "@/lib/auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import { TooltipProvider } from "@/components/ui/tooltip";
import { apiGet } from "@/lib/api-client";

type NavigationItem = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  showBadge?: boolean;
  lordiconSrc?: string;
  tooltip?: string;
};

const DashboardIcon = () => <Lordicon src="https://cdn.lordicon.com/oeotfwsx.json" trigger="hover" size={18} colorize="currentColor" />;
const MapIcon = () => <Lordicon src="https://cdn.lordicon.com/oypudwea.json" trigger="hover" size={18} colorize="currentColor" />;
const DataFeedIcon = () => <Lordicon src="https://cdn.lordicon.com/ulcgigyi.json" trigger="hover" size={18} colorize="currentColor" />;
const AnalysisIcon = () => <Lordicon src="https://cdn.lordicon.com/btfbysou.json" trigger="hover" size={18} colorize="currentColor" />;
const AlertsIcon = () => <Lordicon src="https://cdn.lordicon.com/ahxaipjb.json" trigger="hover" size={18} colorize="currentColor" />;
const SettingsIcon = () => <Lordicon src="https://cdn.lordicon.com/lcawqajy.json" trigger="hover" size={18} colorize="currentColor" />;

const mainNavigation: NavigationItem[] = [
  {
    title: "Dashboard",
    icon: DashboardIcon,
    href: "/dashboard",
    tooltip: "View overview of all crisis data and metrics",
  },
  {
    title: "Crisis Map",
    icon: MapIcon,
    href: "/dashboard/map",
    tooltip: "Interactive global map of crisis locations",
  },
  {
    title: "Data Feed",
    icon: DataFeedIcon,
    href: "/dashboard/data-feed",
    tooltip: "Real-time feed of crisis events and updates",
  },
];

const monitoringNavigation: NavigationItem[] = [
  {
    title: "Analysis",
    icon: AnalysisIcon,
    href: "/dashboard/analysis",
    tooltip: "Advanced analytics and crisis trends",
  },
  {
    title: "Alerts",
    icon: AlertsIcon,
    href: "/dashboard/alerts",
    showBadge: true,
    tooltip: "Manage notifications and alert preferences",
  },
];

const systemNavigation: NavigationItem[] = [
  {
    title: "Settings",
    icon: SettingsIcon,
    href: "/dashboard/settings",
    tooltip: "Configure your account and preferences",
  },
];

interface AppSidebarProps {
  user?: {
    user_email: string;
    name?: string;
    picture?: string;
    user_id?: string;
  } | null;
}

function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [stats, setStats] = useState({ activeCrises: 0, activeRegions: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.user_id) {
          const [alerts, dashboardStats] = await Promise.all([
            apiGet<Array<{ is_read: boolean }>>(`/api/alerts?user_id=${user.user_id}&skip=0&limit=100`),
            apiGet<{ total_crises: number; active_regions: number }>('/api/dashboard/stats?time_range=24h')
          ]);
          const unread = alerts.filter((alert) => !alert.is_read).length;
          setUnreadAlerts(unread);
          setStats({
            activeCrises: dashboardStats.total_crises || 0,
            activeRegions: dashboardStats.active_regions || 0
          });
        }
      } catch (err) {
        console.warn('Failed to fetch sidebar data:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [user?.user_id]);

  const renderNavGroup = (items: NavigationItem[], label?: string) => (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.href;
            const showBadge = item.showBadge && unreadAlerts > 0;
            
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.tooltip || item.title}>
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {showBadge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute right-2 top-1.5 h-5 min-w-5 px-1.5 text-xs group-data-[collapsible=icon]:hidden"
                  >
                    {unreadAlerts}
                  </Badge>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <Logo size="md" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">BlueRelief</span>
                  <span className="truncate text-xs text-muted-foreground">CRISIS PLATFORM</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarSeparator className="mx-0" />
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0">
              <div className="grid grid-cols-2 gap-2 group-data-[collapsible=icon]:grid-cols-1 group-data-[collapsible=icon]:gap-0">
                <div className="flex items-center gap-2 text-xs group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:py-2">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  <span className="group-data-[collapsible=icon]:hidden">
                    <span className="font-semibold text-sidebar-foreground">{stats.activeCrises}</span>
                    <span className="text-muted-foreground ml-1">Crises</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:py-2">
                  <MapPin className="h-3.5 w-3.5 text-destructive" />
                  <span className="group-data-[collapsible=icon]:hidden">
                    <span className="font-semibold text-sidebar-foreground">{stats.activeRegions}</span>
                    <span className="text-muted-foreground ml-1">Regions</span>
                  </span>
                </div>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-0" />

        {renderNavGroup(mainNavigation, "Main")}
        {renderNavGroup(monitoringNavigation, "Monitoring")}
        
        <SidebarSeparator className="mx-0" />
        
        {renderNavGroup(systemNavigation)}
      </SidebarContent>

      <SidebarFooter>
        {user && (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      {user.picture && <AvatarImage src={user.picture} alt={user.name || user.user_email} />}
                      <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                        {user.name ? user.name.charAt(0).toUpperCase() : user.user_email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user.name || "User"}</span>
                    </div>
                    <ChevronUp className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="top"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor className="mr-2 h-4 w-4" />
                    <span>System</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Only redirect if we've finished loading and user is definitely not authenticated
    // Add a small delay to avoid race conditions after login
    if (!loading && !isAuthenticated) {
      const timer = setTimeout(() => {
        // Double-check auth status before redirecting
        router.push("/");
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (user && !user.location) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [user]);

  useEffect(() => {
    if (showOnboarding) {
      // Use router.replace to avoid showing the dashboard again
      const timer = setTimeout(() => {
        router.replace("/onboarding");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showOnboarding, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={64} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Show loading screen while checking onboarding status
  if (showOnboarding && pathname !== '/dashboard/onboarding') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={64} />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                <span>Toggle sidebar</span>
                <Kbd>{typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}</Kbd>
                <span>+</span>
                <Kbd>B</Kbd>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    {theme === "light" ? (
                      <Sun className="h-4 w-4" />
                    ) : theme === "dark" ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Monitor className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Theme</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor className="mr-2 h-4 w-4" />
                    <span>System</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {user?.user_id && <NotificationCenter userId={user.user_id} />}
              <span className="text-sm text-muted-foreground hidden md:inline">
                Crisis Detection Platform
              </span>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-6 p-6 pt-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutContent>{children}</DashboardLayoutContent>;
}
