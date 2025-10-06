"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
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
  LayoutGrid,
  Menu,
  BarChart3,
  TrendingUp,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { logout } from "@/lib/auth";
import { Button } from "@/components/ui/button";

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
        <div className="mt-auto p-4 border-t">
          <div className="flex items-center space-x-3 mb-3">
            {user.picture && (
              <img 
                src={user.picture} 
                alt="Profile" 
                className="w-8 h-8 rounded-full"
              />
            )}
            <div className="flex-1 min-w-0">
              {user.name && (
                <div className="text-sm font-medium truncate">{user.name}</div>
              )}
              <div className="text-xs text-muted-foreground truncate">
                {user.user_email}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
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
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

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

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto">
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
