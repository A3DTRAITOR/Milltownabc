import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowRight, Flower2, Sun, Heart, Leaf, Calendar, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PageContent, SiteSettings } from "@shared/schema";

export default function Home() {
  const { data: pageData, isLoading: pageLoading } = useQuery<{ content: PageContent }>({
    queryKey: ["/api/content", "home"],
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery<{ content: SiteSettings }>({
    queryKey: ["/api/content", "settings"],
  });

  const settings = settingsData?.content;
  const page = pageData?.content;

  const defaultContent: PageContent = {
    title: "Home",
    metaTitle: "Find Your Flow - Yoga Classes & Private Sessions",
    metaDescription: "Discover peace and strength through yoga. Join our welcoming classes for all levels, from gentle restorative to energizing vinyasa flow.",
    heroTitle: "Find Your Balance, Transform Your Life",
    heroSubtitle: "Welcome to a nurturing space where you can reconnect with your body, calm your mind, and discover the transformative power of yoga. Whether you're a beginner or experienced practitioner, there's a place for you on the mat.",
    sections: [
      {
        id: "offerings",
        type: "cards",
        title: "Your Yoga Journey Starts Here",
        items: [
          { title: "Vinyasa Flow", description: "Dynamic, breath-synchronized movement to build strength, flexibility, and inner calm. Perfect for those seeking an energizing practice.", icon: "sun" },
          { title: "Gentle Restorative", description: "Slow, nurturing poses with props to release tension and promote deep relaxation. Ideal for stress relief and recovery.", icon: "flower" },
          { title: "Private Sessions", description: "One-on-one guidance tailored to your unique needs, goals, and experience level. Personalized attention for deeper growth.", icon: "heart" },
        ],
      },
    ],
  };

  const content = page || defaultContent;

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case "sun": return <Sun className="h-8 w-8" />;
      case "flower": return <Flower2 className="h-8 w-8" />;
      case "heart": return <Heart className="h-8 w-8" />;
      case "leaf": return <Leaf className="h-8 w-8" />;
      case "calendar": return <Calendar className="h-8 w-8" />;
      default: return <Flower2 className="h-8 w-8" />;
    }
  };

  if (pageLoading || settingsLoading) {
    return (
      <PublicLayout settings={settings}>
        <div className="min-h-[600px] bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <Skeleton className="h-16 w-3/4 mb-6" />
            <Skeleton className="h-6 w-1/2 mb-8" />
            <div className="flex gap-4">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const seoTitle = content.metaTitle || `${settings?.businessName || "Home"} - Welcome`;
  const seoDescription = content.metaDescription || content.heroSubtitle || "Discover our services and solutions.";

  return (
    <PublicLayout settings={settings}>
      <SEOHead title={seoTitle} description={seoDescription} />
      <section className="relative min-h-[600px] lg:min-h-[700px] bg-gradient-to-br from-primary/10 via-background to-background overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl" data-testid="text-hero-title">
              {content.heroTitle}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground lg:text-xl" data-testid="text-hero-subtitle">
              {content.heroSubtitle}
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" asChild data-testid="button-hero-services">
                <Link href="/services">
                  View Classes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="button-hero-contact">
                <Link href="/contact">
                  Book a Session
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {content.sections?.map((section) => (
        <section key={section.id} className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {section.title && (
              <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl" data-testid={`text-section-${section.id}-title`}>
                {section.title}
              </h2>
            )}
            
            {section.type === "cards" && section.items && (
              <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item, index) => (
                  <Card key={index} className="group p-6 lg:p-8 hover-elevate transition-all duration-300" data-testid={`card-feature-${index}`}>
                    <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
                      {getIcon(item.icon)}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-muted-foreground">{item.description}</p>
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
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Begin Your Practice Today</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Your first class is complimentary. Experience the difference and find the practice that's right for you.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild data-testid="button-cta-schedule">
                <Link href="/services">
                  View Class Schedule
                  <Calendar className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="button-cta-contact">
                <Link href="/contact">
                  Book a Free Intro Session
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
