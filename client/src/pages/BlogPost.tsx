import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Calendar, ArrowLeft, Share2 } from "lucide-react";
import type { BlogPost as BlogPostType, SiteSettings } from "@shared/schema";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading: postLoading } = useQuery<BlogPostType>({
    queryKey: ["/api/blog", slug],
    enabled: !!slug,
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery<{ content: SiteSettings }>({
    queryKey: ["/api/content", "settings"],
  });

  const settings = settingsData?.content;

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (postLoading || settingsLoading) {
    return (
      <PublicLayout settings={settings}>
        <div className="py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-8 w-32 mb-8" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-6 w-48 mb-8" />
            <Skeleton className="aspect-video w-full mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!post) {
    return (
      <PublicLayout settings={settings}>
        <div className="py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-foreground">Post Not Found</h1>
            <p className="mt-4 text-muted-foreground">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Button className="mt-8" asChild>
              <Link href="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout settings={settings}>
      <article className="py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" className="mb-8" asChild data-testid="button-back-to-blog">
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>

          <header>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl" data-testid="text-post-title">
              {post.title}
            </h1>
            <div className="mt-6 flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(post.createdAt)}
              </span>
              <Button variant="ghost" size="sm" onClick={() => navigator.share?.({ title: post.title, url: window.location.href })} data-testid="button-share-post">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {post.featuredImage && (
            <div className="mt-8 aspect-video overflow-hidden rounded-lg">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div 
            className="prose prose-lg mt-12 max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: post.content }}
            data-testid="text-post-content"
          />
        </div>
      </article>
    </PublicLayout>
  );
}
