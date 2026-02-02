import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Loader2, Eye } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface ContentSection {
  heroTitle?: string;
  heroSubtitle?: string;
  metaTitle?: string;
  metaDescription?: string;
  [key: string]: string | undefined;
}

const contentSections = [
  { key: "home", label: "Home Page", fields: ["heroTitle", "heroSubtitle", "metaTitle", "metaDescription"] },
  { key: "about", label: "About Page", fields: ["heroTitle", "heroSubtitle", "content", "metaTitle", "metaDescription"] },
  { key: "services", label: "Training Page", fields: ["heroTitle", "heroSubtitle", "metaTitle", "metaDescription"] },
  { key: "contact", label: "Contact Page", fields: ["heroTitle", "heroSubtitle", "metaTitle", "metaDescription"] },
];

const fieldLabels: Record<string, string> = {
  heroTitle: "Hero Title",
  heroSubtitle: "Hero Subtitle",
  content: "Main Content",
  metaTitle: "SEO Title",
  metaDescription: "SEO Description",
};

export default function AdminContent() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("home");
  const [formData, setFormData] = useState<Record<string, ContentSection>>({});
  const [hasChanges, setHasChanges] = useState<Record<string, boolean>>({});

  const contentQueries = contentSections.map((section) => ({
    key: section.key,
    query: useQuery<{ content: ContentSection | null }>({
      queryKey: ["/api/content", section.key],
    }),
  }));

  const saveMutation = useMutation({
    mutationFn: async ({ key, content }: { key: string; content: ContentSection }) => {
      const res = await apiRequest("PUT", `/api/content/${key}`, { content });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/content", variables.key] });
      toast({ title: "Content saved", description: "Your changes have been saved successfully." });
      setHasChanges((prev) => ({ ...prev, [variables.key]: false }));
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    },
  });

  const getContentForSection = (key: string): ContentSection => {
    if (formData[key]) return formData[key];
    const query = contentQueries.find((q) => q.key === key);
    return query?.query.data?.content || {};
  };

  const updateField = (sectionKey: string, field: string, value: string) => {
    const currentContent = getContentForSection(sectionKey);
    setFormData((prev) => ({
      ...prev,
      [sectionKey]: { ...currentContent, [field]: value },
    }));
    setHasChanges((prev) => ({ ...prev, [sectionKey]: true }));
  };

  const handleSave = (sectionKey: string) => {
    const content = getContentForSection(sectionKey);
    saveMutation.mutate({ key: sectionKey, content });
  };

  const isLoading = contentQueries.some((q) => q.query.isLoading);

  return (
    <AdminLayout title="Content Editor">
      <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Edit Content</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Update the text on your website pages.</p>
          </div>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/">
              <Eye className="h-4 w-4 mr-2" />
              Preview Site
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
              {contentSections.map((section) => (
                <TabsTrigger key={section.key} value={section.key} className="text-xs sm:text-sm py-2" data-testid={`tab-${section.key}`}>
                  {section.label.replace(" Page", "")}
                  {hasChanges[section.key] && <span className="ml-1 text-primary">*</span>}
                </TabsTrigger>
              ))}
            </TabsList>

            {contentSections.map((section) => {
              const content = getContentForSection(section.key);
              return (
                <TabsContent key={section.key} value={section.key}>
                  <Card className="p-4 sm:p-6">
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground">{section.label}</h3>

                      {section.fields.map((field) => (
                        <div key={field} className="space-y-2">
                          <Label htmlFor={`${section.key}-${field}`}>{fieldLabels[field] || field}</Label>
                          {field === "content" || field === "heroSubtitle" || field === "metaDescription" ? (
                            <Textarea
                              id={`${section.key}-${field}`}
                              value={content[field] || ""}
                              onChange={(e) => updateField(section.key, field, e.target.value)}
                              placeholder={`Enter ${fieldLabels[field]?.toLowerCase() || field}...`}
                              rows={field === "content" ? 8 : 3}
                              data-testid={`input-${section.key}-${field}`}
                            />
                          ) : (
                            <Input
                              id={`${section.key}-${field}`}
                              value={content[field] || ""}
                              onChange={(e) => updateField(section.key, field, e.target.value)}
                              placeholder={`Enter ${fieldLabels[field]?.toLowerCase() || field}...`}
                              data-testid={`input-${section.key}-${field}`}
                            />
                          )}
                        </div>
                      ))}

                      <div className="flex justify-end pt-4 border-t">
                        <Button
                          onClick={() => handleSave(section.key)}
                          disabled={!hasChanges[section.key] || saveMutation.isPending}
                          data-testid={`button-save-${section.key}`}
                        >
                          {saveMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}
