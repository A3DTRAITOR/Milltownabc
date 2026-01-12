import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, ArrowLeft, Image } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { BlogPost, InsertBlogPost, MediaFile } from "@shared/schema";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function BlogEditor() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [formData, setFormData] = useState<Partial<InsertBlogPost>>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featuredImage: "",
    metaTitle: "",
    metaDescription: "",
    published: false,
  });
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: ["/api/blog", id],
    enabled: !isNew && !!id,
  });

  const { data: media } = useQuery<MediaFile[]>({
    queryKey: ["/api/media"],
  });

  useEffect(() => {
    if (post && !isNew) {
      setFormData({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || "",
        content: post.content,
        featuredImage: post.featuredImage || "",
        metaTitle: post.metaTitle || "",
        metaDescription: post.metaDescription || "",
        published: post.published || false,
      });
    }
  }, [post, isNew]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<InsertBlogPost>) => {
      if (isNew) {
        return apiRequest("POST", "/api/blog", data);
      } else {
        return apiRequest("PUT", `/api/blog/${id}`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({
        title: isNew ? "Post Created" : "Post Updated",
        description: "Your changes have been saved successfully.",
      });
      if (isNew) {
        navigate("/admin/blog");
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save the post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!formData.title?.trim()) {
      toast({
        title: "Error",
        description: "Title is required.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.content?.trim()) {
      toast({
        title: "Error",
        description: "Content is required.",
        variant: "destructive",
      });
      return;
    }

    const slug = formData.slug?.trim() || slugify(formData.title);
    saveMutation.mutate({ ...formData, slug });
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || slugify(title),
    }));
  };

  if (isLoading && !isNew) {
    return (
      <AdminLayout title="Edit Post">
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isNew ? "New Post" : "Edit Post"}>
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" onClick={() => navigate("/admin/blog")} data-testid="button-back-to-blog">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Posts
        </Button>

        <Card className="p-6">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Post title"
                  data-testid="input-post-title"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-friendly-slug"
                  data-testid="input-post-slug"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Brief summary for blog listing..."
                className="resize-none"
                rows={2}
                data-testid="input-post-excerpt"
              />
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Write your blog post content here... HTML is supported."
                className="min-h-[300px] font-mono text-sm"
                data-testid="input-post-content"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                You can use HTML tags for formatting.
              </p>
            </div>

            <div>
              <Label>Featured Image</Label>
              <div className="mt-2 flex items-center gap-4">
                {formData.featuredImage ? (
                  <div className="relative">
                    <img
                      src={formData.featuredImage}
                      alt="Featured"
                      className="h-24 w-36 rounded-md object-cover"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute -right-2 -top-2"
                      onClick={() => setFormData((prev) => ({ ...prev, featuredImage: "" }))}
                    >
                      &times;
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowMediaPicker(!showMediaPicker)}
                    data-testid="button-select-image"
                  >
                    <Image className="mr-2 h-4 w-4" />
                    Select Image
                  </Button>
                )}
              </div>
              {showMediaPicker && media && media.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-4 rounded-md border border-border p-4">
                  {media.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, featuredImage: file.url }));
                        setShowMediaPicker(false);
                      }}
                      className="aspect-square overflow-hidden rounded-md hover:ring-2 hover:ring-primary"
                    >
                      <img src={file.url} alt={file.originalName} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                value={formData.metaTitle || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))}
                placeholder="SEO title (defaults to post title)"
                maxLength={60}
                data-testid="input-post-meta-title"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {(formData.metaTitle || "").length}/60 characters
              </p>
            </div>
            <div>
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={formData.metaDescription || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))}
                placeholder="SEO description (defaults to excerpt)"
                maxLength={160}
                className="resize-none"
                rows={2}
                data-testid="input-post-meta-description"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {(formData.metaDescription || "").length}/160 characters
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Publish</h3>
              <p className="text-sm text-muted-foreground">Make this post visible on your site</p>
            </div>
            <Switch
              checked={formData.published || false}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, published: checked }))}
              data-testid="switch-publish"
            />
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate("/admin/blog")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-post">
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isNew ? "Create Post" : "Save Changes"}
              </>
            )}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
