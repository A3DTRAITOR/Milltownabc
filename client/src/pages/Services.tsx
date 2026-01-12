import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Lightbulb, BarChart3, Headphones, Rocket, Shield, Zap, ArrowRight } from "lucide-react";
import type { PageContent, SiteSettings } from "@shared/schema";

export default function Services() {
  const { data: pageData, isLoading: pageLoading } = useQuery<{ content: PageContent }>({
    queryKey: ["/api/content", "services"],
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery<{ content: SiteSettings }>({
    queryKey: ["/api/content", "settings"],
  });

  const settings = settingsData?.content;
  const page = pageData?.content;

  const defaultContent: PageContent = {
    title: "Services",
    metaTitle: "Our Services - What We Offer",
    metaDescription: "Explore our comprehensive range of services designed to help your business succeed.",
    heroTitle: "Our Services",
    heroSubtitle: "We offer a comprehensive range of services designed to help your business succeed in today's competitive landscape.",
    sections: [
      {
        id: "services",
        type: "cards",
        items: [
          { title: "Consulting", description: "Strategic advice and guidance to help you make informed business decisions and achieve your goals.", icon: "lightbulb" },
          { title: "Analytics", description: "Data-driven insights to understand your market, customers, and business performance.", icon: "chart" },
          { title: "Support", description: "Dedicated customer support and maintenance to keep your operations running smoothly.", icon: "headphones" },
          { title: "Development", description: "Custom solutions tailored to your unique business requirements and objectives.", icon: "rocket" },
          { title: "Security", description: "Comprehensive security solutions to protect your business and customer data.", icon: "shield" },
          { title: "Optimization", description: "Performance optimization to maximize efficiency and reduce operational costs.", icon: "zap" },
        ],
      },
    ],
  };

  const content = page || defaultContent;

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case "lightbulb": return <Lightbulb className="h-8 w-8" />;
      case "chart": return <BarChart3 className="h-8 w-8" />;
      case "headphones": return <Headphones className="h-8 w-8" />;
      case "rocket": return <Rocket className="h-8 w-8" />;
      case "shield": return <Shield className="h-8 w-8" />;
      case "zap": return <Zap className="h-8 w-8" />;
      default: return <Lightbulb className="h-8 w-8" />;
    }
  };

  if (pageLoading || settingsLoading) {
    return (
      <PublicLayout settings={settings}>
        <div className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-12 w-1/3 mb-6" />
            <Skeleton className="h-6 w-2/3 mb-12" />
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const seoTitle = content.metaTitle || `Services - ${settings?.businessName || "What We Offer"}`;
  const seoDescription = content.metaDescription || content.heroSubtitle || "Explore our services.";

  return (
    <PublicLayout settings={settings}>
      <SEOHead title={seoTitle} description={seoDescription} />
      <section className="bg-gradient-to-b from-primary/5 to-background py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl" data-testid="text-services-title">
              {content.heroTitle}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground lg:text-xl" data-testid="text-services-subtitle">
              {content.heroSubtitle}
            </p>
          </div>
        </div>
      </section>

      {content.sections?.map((section) => (
        <section key={section.id} className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {section.title && (
              <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl mb-12">
                {section.title}
              </h2>
            )}
            
            {section.type === "cards" && section.items && (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item, index) => (
                  <Card key={index} className="group p-6 lg:p-8 hover-elevate transition-all duration-300" data-testid={`card-service-${index}`}>
                    <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {getIcon(item.icon)}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-3 text-muted-foreground">{item.description}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}

      <section className="border-t border-border bg-card py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Need a Custom Solution?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We're here to help you find the perfect solution for your business needs.
            </p>
            <Button size="lg" className="mt-8" asChild data-testid="button-services-contact">
              <Link href="/contact">
                Get a Free Consultation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
