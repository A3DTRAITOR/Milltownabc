import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { FileText, Newspaper, Image, Settings, ArrowRight, Eye } from "lucide-react";
import type { BlogPost, MediaFile } from "@shared/schema";

export default function AdminDashboard() {
  const { data: posts, isLoading: postsLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
  });

  const { data: media, isLoading: mediaLoading } = useQuery<MediaFile[]>({
    queryKey: ["/api/media"],
  });

  const publishedPosts = posts?.filter((p) => p.published).length || 0;
  const draftPosts = posts?.filter((p) => !p.published).length || 0;
  const totalMedia = media?.length || 0;

  const stats = [
    { label: "Published Posts", value: publishedPosts, icon: Newspaper, href: "/admin/blog" },
    { label: "Draft Posts", value: draftPosts, icon: FileText, href: "/admin/blog" },
    { label: "Media Files", value: totalMedia, icon: Image, href: "/admin/media" },
  ];

  const quickActions = [
    { label: "Edit Pages", description: "Update page content and SEO settings", icon: FileText, href: "/admin/pages" },
    { label: "Create Blog Post", description: "Write a new article for your blog", icon: Newspaper, href: "/admin/blog/new" },
    { label: "Upload Media", description: "Add images to your media library", icon: Image, href: "/admin/media" },
    { label: "Site Settings", description: "Configure business info and branding", icon: Settings, href: "/admin/settings" },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Welcome back!</h2>
            <p className="text-muted-foreground">Here's what's happening with your site.</p>
          </div>
          <Button asChild variant="outline" data-testid="button-view-site">
            <a href="/" target="_blank">
              <Eye className="mr-2 h-4 w-4" />
              View Site
            </a>
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-6" data-testid={`card-stat-${stat.label.toLowerCase().replace(" ", "-")}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  {postsLoading || mediaLoading ? (
                    <Skeleton className="h-9 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  )}
                </div>
                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
              <Link href={stat.href} className="mt-4 flex items-center text-sm text-primary hover:underline" data-testid={`link-stat-${stat.label.toLowerCase().replace(" ", "-")}`}>
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
              <Link key={action.href} href={action.href} data-testid={`link-action-${action.label.toLowerCase().replace(" ", "-")}`}>
                <Card className="group p-6 hover-elevate transition-all duration-200 cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {action.label}
                      </h4>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {posts && posts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Recent Blog Posts</h3>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/blog">View all</Link>
              </Button>
            </div>
            <Card className="divide-y divide-border">
              {posts.slice(0, 5).map((post) => (
                <div key={post.id} className="flex items-center justify-between p-4" data-testid={`row-recent-post-${post.id}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{post.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {post.published ? "Published" : "Draft"} • {new Date(post.createdAt!).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/blog/${post.id}`}>Edit</Link>
                  </Button>
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
