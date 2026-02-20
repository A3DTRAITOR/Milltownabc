import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Save, Loader2, Eye, ChevronDown } from "lucide-react";
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

const seoFields = ["metaTitle", "metaDescription"];

export default function AdminContent() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("home");
  const [formData, setFormData] = useState<Record<string, ContentSection>>({});
  const [hasChanges, setHasChanges] = useState<Record<string, boolean>>({});
  const [seoOpen, setSeoOpen] = useState(false);

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
  const currentSection = contentSections.find((s) => s.key === activeSection)!;
  const content = getContentForSection(activeSection);
  const essentialFields = currentSection.fields.filter((f) => !seoFields.includes(f));
  const currentSeoFields = currentSection.fields.filter((f) => seoFields.includes(f));

  return (
    <AdminLayout title="Content Editor">
      <div className="mx-auto max-w-2xl lg:max-w-4xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Update the text on your website pages.</p>
          </div>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto h-11 sm:h-9">
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
          <>
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Editing</Label>
              <Select value={activeSection} onValueChange={setActiveSection}>
                <SelectTrigger className="h-12 text-base" data-testid="select-page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentSections.map((section) => (
                    <SelectItem key={section.key} value={section.key} data-testid={`tab-${section.key}`}>
                      {section.label}
                      {hasChanges[section.key] ? " *" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-5">
              {essentialFields.map((field) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={`${activeSection}-${field}`} className="text-sm font-medium">
                    {fieldLabels[field] || field}
                  </Label>
                  {field === "content" || field === "heroSubtitle" ? (
                    <Textarea
                      id={`${activeSection}-${field}`}
                      value={content[field] || ""}
                      onChange={(e) => updateField(activeSection, field, e.target.value)}
                      placeholder={`Enter ${fieldLabels[field]?.toLowerCase() || field}...`}
                      rows={field === "content" ? 8 : 3}
                      className="min-h-[48px] text-base"
                      data-testid={`input-${activeSection}-${field}`}
                    />
                  ) : (
                    <Input
                      id={`${activeSection}-${field}`}
                      value={content[field] || ""}
                      onChange={(e) => updateField(activeSection, field, e.target.value)}
                      placeholder={`Enter ${fieldLabels[field]?.toLowerCase() || field}...`}
                      className="h-12 text-base"
                      data-testid={`input-${activeSection}-${field}`}
                    />
                  )}
                </div>
              ))}

              {currentSeoFields.length > 0 && (
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
                    {currentSeoFields.map((field) => (
                      <div key={field} className="space-y-2">
                        <Label htmlFor={`${activeSection}-${field}`} className="text-sm font-medium">
                          {fieldLabels[field] || field}
                        </Label>
                        {field === "metaDescription" ? (
                          <Textarea
                            id={`${activeSection}-${field}`}
                            value={content[field] || ""}
                            onChange={(e) => updateField(activeSection, field, e.target.value)}
                            placeholder={`Enter ${fieldLabels[field]?.toLowerCase() || field}...`}
                            rows={3}
                            className="min-h-[48px] text-base"
                            data-testid={`input-${activeSection}-${field}`}
                          />
                        ) : (
                          <Input
                            id={`${activeSection}-${field}`}
                            value={content[field] || ""}
                            onChange={(e) => updateField(activeSection, field, e.target.value)}
                            placeholder={`Enter ${fieldLabels[field]?.toLowerCase() || field}...`}
                            className="h-12 text-base"
                            data-testid={`input-${activeSection}-${field}`}
                          />
                        )}
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              <div className="pt-4">
                <Button
                  onClick={() => handleSave(activeSection)}
                  disabled={!hasChanges[activeSection] || saveMutation.isPending}
                  className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm"
                  data-testid={`button-save-${activeSection}`}
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
          </>
        )}
      </div>
    </AdminLayout>
  );
}
