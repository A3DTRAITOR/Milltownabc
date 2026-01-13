import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Sun, Moon, Heart, Users, Sparkles, Mountain, ArrowRight } from "lucide-react";
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
    title: "Classes & Services",
    metaTitle: "Yoga Classes & Services - Find Your Perfect Practice",
    metaDescription: "From energizing vinyasa to calming restorative yoga, explore classes for all levels. Private sessions and workshops also available.",
    heroTitle: "Classes & Offerings",
    heroSubtitle: "Discover a variety of yoga classes designed to meet you where you are. Whether you seek energy and strength or calm and restoration, there's a practice waiting for you.",
    sections: [
      {
        id: "classes",
        type: "cards",
        items: [
          { title: "Vinyasa Flow", description: "A dynamic practice linking breath with movement. Build strength, flexibility, and focus through flowing sequences. All levels welcome.", icon: "sun" },
          { title: "Gentle Yoga", description: "Slow, accessible poses perfect for beginners or those seeking a softer practice. Focus on breath, alignment, and relaxation.", icon: "moon" },
          { title: "Restorative Yoga", description: "Deep relaxation using props to support the body in restful poses. Release tension and restore your nervous system.", icon: "sparkles" },
          { title: "Private Sessions", description: "One-on-one instruction tailored to your goals, injuries, or schedule. Perfect for personalized attention and deeper learning.", icon: "heart" },
          { title: "Group Classes", description: "Join our welcoming community for regularly scheduled classes. Build connections while building your practice.", icon: "users" },
          { title: "Workshops & Retreats", description: "Immersive experiences to deepen your practice. From weekend workshops to transformative retreats.", icon: "mountain" },
        ],
      },
    ],
  };

  const content = page || defaultContent;

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case "sun": return <Sun className="h-8 w-8" />;
      case "moon": return <Moon className="h-8 w-8" />;
      case "heart": return <Heart className="h-8 w-8" />;
      case "users": return <Users className="h-8 w-8" />;
      case "sparkles": return <Sparkles className="h-8 w-8" />;
      case "mountain": return <Mountain className="h-8 w-8" />;
      default: return <Sun className="h-8 w-8" />;
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
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Not Sure Where to Start?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Book a free discovery call and let's find the perfect practice for your goals, experience level, and schedule.
            </p>
            <Button size="lg" className="mt-8" asChild data-testid="button-services-contact">
              <Link href="/contact">
                Schedule a Free Consultation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
