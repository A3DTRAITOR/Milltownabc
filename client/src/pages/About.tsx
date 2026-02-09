import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
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
    metaTitle: "About Us - Mill Town ABC",
    metaDescription: "Learn about Mill Town ABC in Glossop. Home to Head Coach Alex Clegg, ABA National Champion with over 70 amateur bouts and 8x North West Champion.",
    heroTitle: "Our Story",
    heroSubtitle: "Mill Town ABC is based at Whitfield Community Centre in Glossop. Led by Head Coach Alex Clegg, an ex-amateur boxer who started at age 8, with over 70 amateur bouts, 8x North West Champion, boxed for the Northwest Regional Team, ABA National Champion, competed in the 3 Nations Championships, and internationally boxed and beat champions from Spain, Poland, Scotland, and Ireland.",
    sections: [
      {
        id: "values",
        type: "cards",
        title: "What We Stand For",
        items: [
          { title: "Discipline", description: "Boxing teaches focus, commitment, and self-control. These skills transfer to every aspect of life, making you stronger both mentally and physically.", icon: "target" },
          { title: "Respect", description: "We foster a supportive environment where everyone is treated with respect. Our gym is a place where champions are built through encouragement, not intimidation.", icon: "shield" },
          { title: "Excellence", description: "Whether you're training for fitness or competition, we push you to be your best. Learn from a proven champion with real competitive experience.", icon: "trophy" },
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

  const seoTitle = content.metaTitle || `About Mill Town ABC - Boxing Club Glossop | Head Coach Alex Clegg`;
  const seoDescription = content.metaDescription || content.heroSubtitle || "Mill Town ABC is based at Whitfield Community Centre in Glossop. Led by Head Coach Alex Clegg, ABA National Champion with 70+ amateur bouts.";

  return (
    <PublicLayout settings={settings}>
      <SEOHead title={seoTitle} description={seoDescription} />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "About", url: "/about" }]} />
      
      {/* Hero - Dark */}
      <section className="bg-foreground py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
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

      {/* Club Stats */}
      <section className="bg-primary py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-white">
            <div className="text-center">
              <div className="text-5xl font-black">4</div>
              <div className="mt-2 text-sm uppercase tracking-wider opacity-80">Weekly Classes</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black">£5</div>
              <div className="mt-2 text-sm uppercase tracking-wider opacity-80">Per Session</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black">FREE</div>
              <div className="mt-2 text-sm uppercase tracking-wider opacity-80">First Session</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black">£0</div>
              <div className="mt-2 text-sm uppercase tracking-wider opacity-80">Joining Fee</div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
