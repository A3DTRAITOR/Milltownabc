import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { PageContent } from "@shared/schema";

const pages = [
  { key: "home", label: "Home" },
  { key: "about", label: "About" },
  { key: "services", label: "Services" },
  { key: "blog", label: "Blog" },
  { key: "contact", label: "Contact" },
];

export default function AdminPages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPage, setSelectedPage] = useState("home");

  const { data: pageData, isLoading } = useQuery<{ content: PageContent }>({
    queryKey: ["/api/content", selectedPage],
  });

  const [formData, setFormData] = useState<Partial<PageContent>>({});

  const updateMutation = useMutation({
    mutationFn: async (content: Partial<PageContent>) => {
      return apiRequest("PUT", `/api/content/${selectedPage}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content", selectedPage] });
      toast({
        title: "Page Updated",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const content = { ...pageData?.content, ...formData };
    updateMutation.mutate(content);
  };

  const handleInputChange = (field: keyof PageContent, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const currentContent = { ...pageData?.content, ...formData };

  return (
    <AdminLayout title="Edit Pages">
      <div className="mx-auto max-w-4xl space-y-6">
        <Tabs value={selectedPage} onValueChange={(v) => { setSelectedPage(v); setFormData({}); }}>
          <TabsList className="grid w-full grid-cols-5" data-testid="tabs-pages">
            {pages.map((page) => (
              <TabsTrigger key={page.key} value={page.key} data-testid={`tab-page-${page.key}`}>
                {page.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {pages.map((page) => (
            <TabsContent key={page.key} value={page.key} className="space-y-6 mt-6">
              {isLoading ? (
                <Card className="p-6 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-32 w-full" />
                </Card>
              ) : (
                <>
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="metaTitle">Meta Title</Label>
                        <Input
                          id="metaTitle"
                          value={currentContent?.metaTitle || ""}
                          onChange={(e) => handleInputChange("metaTitle", e.target.value)}
                          placeholder="Page title for search engines"
                          maxLength={60}
                          data-testid="input-meta-title"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {(currentContent?.metaTitle || "").length}/60 characters
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="metaDescription">Meta Description</Label>
                        <Textarea
                          id="metaDescription"
                          value={currentContent?.metaDescription || ""}
                          onChange={(e) => handleInputChange("metaDescription", e.target.value)}
                          placeholder="Brief description for search results"
                          maxLength={160}
                          className="resize-none"
                          rows={3}
                          data-testid="input-meta-description"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {(currentContent?.metaDescription || "").length}/160 characters
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Hero Section</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="heroTitle">Hero Title</Label>
                        <Input
                          id="heroTitle"
                          value={currentContent?.heroTitle || ""}
                          onChange={(e) => handleInputChange("heroTitle", e.target.value)}
                          placeholder="Main headline"
                          data-testid="input-hero-title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                        <Textarea
                          id="heroSubtitle"
                          value={currentContent?.heroSubtitle || ""}
                          onChange={(e) => handleInputChange("heroSubtitle", e.target.value)}
                          placeholder="Supporting text below headline"
                          className="resize-none"
                          rows={3}
                          data-testid="input-hero-subtitle"
                        />
                      </div>
                    </div>
                  </Card>

                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSave} 
                      disabled={updateMutation.isPending}
                      data-testid="button-save-page"
                    >
                      {updateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
