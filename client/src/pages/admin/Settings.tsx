import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, ChevronDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { SiteSettings } from "@shared/schema";

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [seoOpen, setSeoOpen] = useState(false);

  const { data: settingsData, isLoading } = useQuery<{ content: SiteSettings }>({
    queryKey: ["/api/content", "settings"],
  });

  const [formData, setFormData] = useState<SiteSettings>({
    businessName: "",
    tagline: "",
    logo: "",
    phone: "",
    email: "",
    address: "",
    socialLinks: {
      facebook: "",
      twitter: "",
      instagram: "",
      linkedin: "",
    },
    localBusiness: {
      type: "LocalBusiness",
      priceRange: "",
      openingHours: "",
    },
  });

  useEffect(() => {
    if (settingsData?.content) {
      setFormData({
        ...formData,
        ...settingsData.content,
        socialLinks: {
          ...formData.socialLinks,
          ...settingsData.content.socialLinks,
        },
        localBusiness: {
          ...formData.localBusiness,
          ...settingsData.content.localBusiness,
        },
      });
    }
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: async (content: SiteSettings) => {
      return apiRequest("PUT", "/api/content/settings", { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content", "settings"] });
      toast({
        title: "Settings Saved",
        description: "Your site settings have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleInputChange = (path: string, value: string) => {
    const keys = path.split(".");
    setFormData((prev) => {
      const newData = { ...prev };
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  if (isLoading) {
    return (
      <AdminLayout title="Site Settings">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Site Settings">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Business Information</h3>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  className="h-12 text-base"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange("businessName", e.target.value)}
                  placeholder="Your Business Name"
                  data-testid="input-business-name"
                />
              </div>
              <div>
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  className="h-12 text-base"
                  value={formData.tagline}
                  onChange={(e) => handleInputChange("tagline", e.target.value)}
                  placeholder="Your business tagline"
                  data-testid="input-tagline"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                className="h-12 text-base"
                value={formData.logo}
                onChange={(e) => handleInputChange("logo", e.target.value)}
                placeholder="https://example.com/logo.png"
                data-testid="input-logo"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  className="h-12 text-base"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="contact@example.com"
                  data-testid="input-email"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  className="h-12 text-base"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  data-testid="input-phone"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="123 Business St, City, State 12345"
                className="resize-none"
                rows={2}
                data-testid="input-address"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Social Media Links</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                className="h-12 text-base"
                value={formData.socialLinks?.facebook}
                onChange={(e) => handleInputChange("socialLinks.facebook", e.target.value)}
                placeholder="https://facebook.com/yourbusiness"
                data-testid="input-facebook"
              />
            </div>
            <div>
              <Label htmlFor="twitter">Twitter / X</Label>
              <Input
                id="twitter"
                className="h-12 text-base"
                value={formData.socialLinks?.twitter}
                onChange={(e) => handleInputChange("socialLinks.twitter", e.target.value)}
                placeholder="https://twitter.com/yourbusiness"
                data-testid="input-twitter"
              />
            </div>
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                className="h-12 text-base"
                value={formData.socialLinks?.instagram}
                onChange={(e) => handleInputChange("socialLinks.instagram", e.target.value)}
                placeholder="https://instagram.com/yourbusiness"
                data-testid="input-instagram"
              />
            </div>
            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                className="h-12 text-base"
                value={formData.socialLinks?.linkedin}
                onChange={(e) => handleInputChange("socialLinks.linkedin", e.target.value)}
                placeholder="https://linkedin.com/company/yourbusiness"
                data-testid="input-linkedin"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <Collapsible open={seoOpen} onOpenChange={setSeoOpen}>
            <CollapsibleTrigger asChild>
              <button type="button" className="flex items-center justify-between w-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <span>SEO / Local Business Schema</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${seoOpen ? "rotate-180" : ""}`} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-5 pt-2">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="businessType">Business Type</Label>
                    <Input
                      id="businessType"
                      className="h-12 text-base"
                      value={formData.localBusiness?.type}
                      onChange={(e) => handleInputChange("localBusiness.type", e.target.value)}
                      placeholder="LocalBusiness, Restaurant, Store..."
                      data-testid="input-business-type"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priceRange">Price Range</Label>
                    <Input
                      id="priceRange"
                      className="h-12 text-base"
                      value={formData.localBusiness?.priceRange}
                      onChange={(e) => handleInputChange("localBusiness.priceRange", e.target.value)}
                      placeholder="$, $$, $$$, $$$$"
                      data-testid="input-price-range"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="openingHours">Opening Hours</Label>
                  <Input
                    id="openingHours"
                    className="h-12 text-base"
                    value={formData.localBusiness?.openingHours}
                    onChange={(e) => handleInputChange("localBusiness.openingHours", e.target.value)}
                    placeholder="Mo-Fr 09:00-17:00"
                    data-testid="input-opening-hours"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        <div className="flex justify-end">
          <Button className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm" onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-settings">
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
