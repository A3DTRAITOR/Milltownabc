import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Calendar, Users, ClipboardList, ArrowRight, Eye } from "lucide-react";

interface AdminStats {
  totalClasses: number;
  classesThisWeek: number;
  totalBookings: number;
  totalMembers: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const statCards = [
    { label: "Classes This Week", value: stats?.classesThisWeek || 0, icon: Calendar, href: "/admin/calendar" },
    { label: "Total Bookings", value: stats?.totalBookings || 0, icon: ClipboardList, href: "/admin/calendar" },
    { label: "Total Members", value: stats?.totalMembers || 0, icon: Users, href: "/admin" },
  ];

  const quickActions = [
    { label: "Manage Calendar", description: "Add, edit, or delete class sessions", icon: Calendar, href: "/admin/calendar" },
    { label: "Edit Content", description: "Update homepage, about, and other pages", icon: ClipboardList, href: "/admin/content" },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Welcome to Admin</h2>
            <p className="text-muted-foreground">Manage your boxing club from here.</p>
          </div>
          <Button asChild variant="outline" data-testid="button-view-site">
            <Link href="/">
              <Eye className="mr-2 h-4 w-4" />
              View Site
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat) => (
            <Card key={stat.label} className="p-6" data-testid={`card-stat-${stat.label.toLowerCase().replace(/ /g, "-")}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  {isLoading ? (
                    <Skeleton className="h-9 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  )}
                </div>
                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
              <Link href={stat.href} className="mt-4 flex items-center text-sm text-primary hover:underline" data-testid={`link-stat-${stat.label.toLowerCase().replace(/ /g, "-")}`}>
                View details
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Card>
          ))}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href} data-testid={`link-action-${action.label.toLowerCase().replace(/ /g, "-")}`}>
                <Card className="p-6 hover-elevate cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">
                        {action.label}
                      </h4>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
