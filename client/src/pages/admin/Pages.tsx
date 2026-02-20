import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, ChevronDown } from "lucide-react";
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
  const [seoOpen, setSeoOpen] = useState(false);

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
      <div className="mx-auto max-w-2xl lg:max-w-4xl space-y-5">
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">Editing</Label>
          <Select
            value={selectedPage}
            onValueChange={(v) => { setSelectedPage(v); setFormData({}); }}
          >
            <SelectTrigger className="h-12 text-base" data-testid="tabs-pages">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pages.map((page) => (
                <SelectItem key={page.key} value={page.key} data-testid={`tab-page-${page.key}`}>
                  {page.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="heroTitle">Hero Title</Label>
              <Input
                id="heroTitle"
                value={currentContent?.heroTitle || ""}
                onChange={(e) => handleInputChange("heroTitle", e.target.value)}
                placeholder="Main headline"
                className="h-12 text-base"
                data-testid="input-hero-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
              <Textarea
                id="heroSubtitle"
                value={currentContent?.heroSubtitle || ""}
                onChange={(e) => handleInputChange("heroSubtitle", e.target.value)}
                placeholder="Supporting text below headline"
                className="resize-none min-h-[48px] text-base"
                rows={3}
                data-testid="input-hero-subtitle"
              />
            </div>

            <Collapsible open={seoOpen} onOpenChange={setSeoOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-between w-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="toggle-seo"
                >
                  <span>Advanced / SEO</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${seoOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-5 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={currentContent?.metaTitle || ""}
                    onChange={(e) => handleInputChange("metaTitle", e.target.value)}
                    placeholder="Page title for search engines"
                    maxLength={60}
                    className="h-12 text-base"
                    data-testid="input-meta-title"
                  />
                  <p className="text-xs text-muted-foreground">
                    {(currentContent?.metaTitle || "").length}/60 characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={currentContent?.metaDescription || ""}
                    onChange={(e) => handleInputChange("metaDescription", e.target.value)}
                    placeholder="Brief description for search results"
                    maxLength={160}
                    className="resize-none min-h-[48px] text-base"
                    rows={3}
                    data-testid="input-meta-description"
                  />
                  <p className="text-xs text-muted-foreground">
                    {(currentContent?.metaDescription || "").length}/160 characters
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm"
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
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
