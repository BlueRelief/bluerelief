"use client"

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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

function AppSidebar() {
  const pathname = usePathname();
  
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
    </Sidebar>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
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
