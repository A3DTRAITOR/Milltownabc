import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Shield, Trophy } from "lucide-react";
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
    metaTitle: "About Us - Milltown Boxing Club",
    metaDescription: "Learn about Milltown Boxing Club's history, our trainers, and our commitment to developing champions both in and out of the ring.",
    heroTitle: "Our Story",
    heroSubtitle: "For over 10 years, Milltown Boxing Club has been the home of champions. From complete beginners to competitive fighters, we've helped hundreds of people discover the discipline, strength, and confidence that boxing brings.",
    sections: [
      {
        id: "values",
        type: "cards",
        title: "What We Stand For",
        items: [
          { title: "Discipline", description: "Boxing teaches focus, commitment, and self-control. These skills transfer to every aspect of life, making you stronger both mentally and physically.", icon: "target" },
          { title: "Respect", description: "We foster a supportive environment where everyone is treated with respect. Our gym is a place where champions are built through encouragement, not intimidation.", icon: "shield" },
          { title: "Excellence", description: "Whether you're training for fitness or competition, we push you to be your best. Our experienced trainers bring out the champion in everyone.", icon: "trophy" },
        ],
      },
    ],
  };

  const content: PageContent = {
    title: page?.title || defaultContent.title,
    metaTitle: page?.metaTitle || defaultContent.metaTitle,
    metaDescription: page?.metaDescription || defaultContent.metaDescription,
    heroTitle: page?.heroTitle || defaultContent.heroTitle,
    heroSubtitle: page?.heroSubtitle || defaultContent.heroSubtitle,
    sections: page?.sections?.length ? page.sections : defaultContent.sections,
  };

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case "target": return <Target className="h-8 w-8" />;
      case "shield": return <Shield className="h-8 w-8" />;
      case "trophy": return <Trophy className="h-8 w-8" />;
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

  const seoTitle = content.metaTitle || `About Us - ${settings?.businessName || "Milltown Boxing Club"}`;
  const seoDescription = content.metaDescription || content.heroSubtitle || "Learn about our mission and values.";

  return (
    <PublicLayout settings={settings}>
      <SEOHead title={seoTitle} description={seoDescription} />
      
      {/* Hero - Dark */}
      <section className="bg-foreground py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1 mb-4 text-sm font-semibold tracking-wider text-primary uppercase bg-primary/10 rounded-full">
              About Us
            </span>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl uppercase" data-testid="text-about-title">
              {content.heroTitle}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-gray-300 lg:text-xl" data-testid="text-about-subtitle">
              {content.heroSubtitle}
            </p>
          </div>
        </div>
      </section>

      {content.sections?.map((section) => (
        <section key={section.id} className="py-16 lg:py-24 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {section.title && (
              <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl mb-12 uppercase tracking-tight" data-testid={`text-section-${section.id}-title`}>
                {section.title}
              </h2>
            )}
            
            {section.type === "cards" && section.items && (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item, index) => (
                  <Card key={index} className="p-6 lg:p-8 text-center border-2" data-testid={`card-value-${index}`}>
                    <div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 p-4 text-primary">
                      {getIcon(item.icon)}
                    </div>
                    <h3 className="text-xl font-bold text-foreground uppercase">{item.title}</h3>
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

      {/* Stats */}
      <section className="bg-primary py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-white">
            <div className="text-center">
              <div className="text-5xl font-black">10+</div>
              <div className="mt-2 text-sm uppercase tracking-wider opacity-80">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black">500+</div>
              <div className="mt-2 text-sm uppercase tracking-wider opacity-80">Members Trained</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black">25+</div>
              <div className="mt-2 text-sm uppercase tracking-wider opacity-80">Competition Wins</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black">4</div>
              <div className="mt-2 text-sm uppercase tracking-wider opacity-80">Expert Trainers</div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
