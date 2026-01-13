import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Eye, Heart } from "lucide-react";
import type { PageContent, SiteSettings } from "@shared/schema";

export default function About() {
  const { data: pageData, isLoading: pageLoading } = useQuery<{ content: PageContent }>({
    queryKey: ["/api/content", "about"],
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery<{ content: SiteSettings }>({
    queryKey: ["/api/content", "settings"],
  });

  const settings = settingsData?.content;
  const page = pageData?.content;

  const defaultContent: PageContent = {
    title: "About",
    metaTitle: "About - Meet Your Yoga Instructor",
    metaDescription: "Learn about my yoga journey, teaching philosophy, and how I can guide you toward greater balance and well-being.",
    heroTitle: "My Yoga Journey",
    heroSubtitle: "For over 10 years, yoga has been my path to healing, growth, and self-discovery. Now, I'm honored to share this transformative practice with you, creating a safe and nurturing space where everyone is welcome exactly as they are.",
    sections: [
      {
        id: "philosophy",
        type: "cards",
        title: "My Teaching Philosophy",
        items: [
          { title: "Mindful Movement", description: "Every pose is an opportunity to connect breath with movement, cultivating awareness and presence on the mat and in daily life.", icon: "target" },
          { title: "Inclusive Practice", description: "Yoga is for every body. I offer modifications and variations so everyone can experience the benefits of practice, regardless of experience or ability.", icon: "eye" },
          { title: "Heart-Centered", description: "Beyond the physical postures, yoga is about compassion—for ourselves and others. I create a judgment-free space where you can explore and grow.", icon: "heart" },
        ],
      },
    ],
  };

  const content = page || defaultContent;

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case "target": return <Target className="h-8 w-8" />;
      case "eye": return <Eye className="h-8 w-8" />;
      case "heart": return <Heart className="h-8 w-8" />;
      default: return <Target className="h-8 w-8" />;
    }
  };

  if (pageLoading || settingsLoading) {
    return (
      <PublicLayout settings={settings}>
        <div className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-12 w-1/3 mb-6" />
            <Skeleton className="h-6 w-2/3 mb-12" />
            <div className="grid gap-8 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const seoTitle = content.metaTitle || `About Us - ${settings?.businessName || "Our Story"}`;
  const seoDescription = content.metaDescription || content.heroSubtitle || "Learn about our mission and values.";

  return (
    <PublicLayout settings={settings}>
      <SEOHead title={seoTitle} description={seoDescription} />
      <section className="bg-gradient-to-b from-primary/5 to-background py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl" data-testid="text-about-title">
              {content.heroTitle}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground lg:text-xl" data-testid="text-about-subtitle">
              {content.heroSubtitle}
            </p>
          </div>
        </div>
      </section>

      {content.sections?.map((section) => (
        <section key={section.id} className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {section.title && (
              <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl mb-12" data-testid={`text-section-${section.id}-title`}>
                {section.title}
              </h2>
            )}
            
            {section.type === "cards" && section.items && (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item, index) => (
                  <Card key={index} className="p-6 lg:p-8 text-center" data-testid={`card-value-${index}`}>
                    <div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 p-4 text-primary">
                      {getIcon(item.icon)}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-3 text-muted-foreground">{item.description}</p>
                  </Card>
                ))}
              </div>
            )}

            {section.type === "text" && (
              <div className="prose prose-lg mx-auto max-w-prose text-muted-foreground">
                <p>{section.content}</p>
              </div>
            )}
          </div>
        </section>
      ))}

      <section className="border-t border-border bg-card py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">500+</div>
              <div className="mt-2 text-muted-foreground">Hours of Training</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">1000+</div>
              <div className="mt-2 text-muted-foreground">Classes Taught</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">200+</div>
              <div className="mt-2 text-muted-foreground">Happy Students</div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
