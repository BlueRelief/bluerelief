"use client"

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Logo } from "@/components/logo";
import { LocationOnboarding } from "@/components/location-onboarding";
import { NotificationCenter } from "@/components/notification-center";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutGrid,
  Menu,
  BarChart3,
  TrendingUp,
  Bell,
  Settings,
  LogOut,
  Sun,
  Moon,
  Monitor,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { logout } from "@/lib/auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const navigation = [
  {
    title: "Dashboard",
    icon: LayoutGrid,
    href: "/dashboard",
  },
  {
    title: "Data Feed",
    icon: Menu,
    href: "/dashboard/data-feed",
  },
  {
    title: "Analysis",
    icon: BarChart3,
    href: "/dashboard/analysis",
  },
  {
    title: "Visualizations",
    icon: TrendingUp,
    href: "/dashboard/visualizations",
  },
  {
    title: "Alerts",
    icon: Bell,
    href: "/dashboard/alerts",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

interface AppSidebarProps {
  user?: {
    user_email: string;
    name?: string;
    picture?: string;
  } | null;
}

function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-2">
          <Logo size="sm" />
          <span className="font-bold text-sidebar-foreground">BlueRelief</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {user && (
        <div className="mt-auto border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full p-3 hover:bg-sidebar-accent transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.picture} alt={user.name || user.user_email} />
                  <AvatarFallback className="text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.user_email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  {user.name && (
                    <div className="text-sm font-medium truncate text-sidebar-foreground">{user.name}</div>
                  )}
                  <div className="text-xs text-muted-foreground truncate">
                    {user.user_email}
                  </div>
                </div>
                <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-56 mb-2">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  {user.name && (
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                  )}
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.user_email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Monitor className="mr-2 h-4 w-4" />
                  <span>Theme</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                    {theme === "light" && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                    {theme === "dark" && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor className="mr-2 h-4 w-4" />
                    <span>System</span>
                    {theme === "system" && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </Sidebar>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, loading, refreshAuth } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
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
      setRedirecting(true);
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
        <div className="text-muted-foreground">Loading...</div>
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
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto flex items-center gap-4">
            {user?.user_id && <NotificationCenter userId={user.user_id} />}
            <span className="text-sm text-muted-foreground">
              Crisis Detection Platform
            </span>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
