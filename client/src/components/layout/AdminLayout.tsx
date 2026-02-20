import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Calendar, FileText, LogOut, ExternalLink, Users, ClipboardList, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/schedule", label: "Schedule", icon: Clock },
  { href: "/admin/calendar", label: "Calendar", icon: Calendar },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/admin/content", label: "Content", icon: FileText },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

interface MemberData {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

function SidebarNavContent({ member, handleLogout }: { member: MemberData; handleLogout: () => void }) {
  const [location] = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link href="/admin" className="flex items-center gap-2" onClick={handleNavClick} data-testid="link-admin-home">
          <img src="/logo.png" alt="Mill Town ABC" className="w-8 h-8 rounded-full" />
          <span className="font-semibold text-sidebar-foreground">Admin Panel</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.href}
                    className="h-12 text-base md:h-9 md:text-sm"
                  >
                    <Link href={item.href} onClick={handleNavClick} data-testid={`link-admin-nav-${item.label.toLowerCase()}`}>
                      <item.icon className="h-5 w-5 md:h-4 md:w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Quick Links</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-12 text-base md:h-9 md:text-sm">
                  <Link href="/" onClick={handleNavClick} data-testid="link-view-site">
                    <ExternalLink className="h-5 w-5 md:h-4 md:w-4" />
                    <span>View Site</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{member.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {member.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => { handleNavClick(); handleLogout(); }}
            data-testid="button-admin-logout"
            title="Logout"
            className="h-12 w-12 md:h-8 md:w-8"
          >
            <LogOut className="h-5 w-5 md:h-4 md:w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </>
  );
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: member, isLoading, isError } = useQuery<MemberData>({
    queryKey: ["/api/members/me"],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && (isError || !member)) {
      setLocation("/login");
    }
  }, [isLoading, isError, member, setLocation]);

  const isAdminUser = member?.isAdmin === true;

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/members/logout");
      toast({ title: "Logged out", description: "You have been logged out successfully." });
      setLocation("/");
    } catch (error) {
      console.error("Logout failed:", error);
      toast({ title: "Logout failed", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <LayoutDashboard className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin Access Required</h1>
          <p className="text-muted-foreground">
            Please log in to access the admin dashboard.
          </p>
          <Button size="lg" asChild data-testid="button-admin-login">
            <Link href="/login">Log In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!isAdminUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <LayoutDashboard className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access the admin dashboard. Please contact an administrator if you believe this is an error.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" asChild data-testid="button-go-home">
              <Link href="/">Go Home</Link>
            </Button>
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              Log Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarNavContent member={member} handleLogout={handleLogout} />
        </Sidebar>
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 border-b border-border bg-background px-4 py-3 lg:px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-12 w-12 md:h-9 md:w-9" data-testid="button-sidebar-toggle" />
              {title && <h1 className="text-lg lg:text-xl font-semibold text-foreground truncate">{title}</h1>}
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-muted/30 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
