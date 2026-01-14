import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Dumbbell, Zap, Users, User, Trophy, Target, ArrowRight } from "lucide-react";
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
    title: "Training Programs",
    metaTitle: "Training Programs - Milltown Boxing Club",
    metaDescription: "From beginner fundamentals to advanced competition training, find the perfect boxing program for your goals at Milltown Boxing Club.",
    heroTitle: "Training Programs",
    heroSubtitle: "We offer a range of boxing programs designed for all skill levels. Whether you're looking to get fit, learn self-defense, or compete in the ring, we have a program for you.",
    sections: [
      {
        id: "programs",
        type: "cards",
        items: [
          { title: "Boxing Fundamentals", description: "Master the basics of boxing including stance, footwork, jab, cross, hook, and uppercut. Perfect for complete beginners.", icon: "dumbbell" },
          { title: "Fitness Boxing", description: "High-intensity workouts that combine boxing techniques with cardio training. Get fit without stepping into the ring.", icon: "zap" },
          { title: "Technique Classes", description: "Refine your skills with advanced combinations, defensive movements, and ring strategy. For intermediate to advanced boxers.", icon: "target" },
          { title: "Private Training", description: "One-on-one sessions with our expert trainers. Personalized attention to accelerate your progress.", icon: "user" },
          { title: "Group Classes", description: "Train with a supportive community. Our group classes build camaraderie while pushing you to improve.", icon: "users" },
          { title: "Competition Prep", description: "Intensive training for those looking to compete. Includes sparring, conditioning, and fight strategy.", icon: "trophy" },
        ],
      },
    ],
  };

  const content = page || defaultContent;

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case "dumbbell": return <Dumbbell className="h-8 w-8" />;
      case "zap": return <Zap className="h-8 w-8" />;
      case "target": return <Target className="h-8 w-8" />;
      case "user": return <User className="h-8 w-8" />;
      case "users": return <Users className="h-8 w-8" />;
      case "trophy": return <Trophy className="h-8 w-8" />;
      default: return <Dumbbell className="h-8 w-8" />;
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

  const seoTitle = content.metaTitle || `Training - ${settings?.businessName || "Milltown Boxing Club"}`;
  const seoDescription = content.metaDescription || content.heroSubtitle || "Explore our training programs.";

  return (
    <PublicLayout settings={settings}>
      <SEOHead title={seoTitle} description={seoDescription} />
      
      {/* Hero - Dark */}
      <section className="bg-foreground py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1 mb-4 text-sm font-semibold tracking-wider text-primary uppercase bg-primary/10 rounded-full">
              Programs
            </span>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl uppercase" data-testid="text-services-title">
              {content.heroTitle}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-gray-300 lg:text-xl" data-testid="text-services-subtitle">
              {content.heroSubtitle}
            </p>
          </div>
        </div>
      </section>

      {content.sections?.map((section) => (
        <section key={section.id} className="py-16 lg:py-24 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {section.title && (
              <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl mb-12 uppercase tracking-tight">
                {section.title}
              </h2>
            )}
            
            {section.type === "cards" && section.items && (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item, index) => (
                  <Card key={index} className="group p-6 lg:p-8 hover-elevate transition-all duration-300 border-2" data-testid={`card-service-${index}`}>
                    <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      {getIcon(item.icon)}
                    </div>
                    <h3 className="text-xl font-bold text-foreground uppercase">{item.title}</h3>
                    <p className="mt-3 text-muted-foreground">{item.description}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}

      {/* Pricing Section */}
      <section className="bg-card border-t border-border py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl uppercase tracking-tight">
              Simple Pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              No complicated memberships. Just pay per session and train when it works for you.
            </p>
            <div className="mt-8 inline-flex items-baseline gap-2">
              <span className="text-6xl font-black text-primary">£15</span>
              <span className="text-xl text-muted-foreground">per session</span>
            </div>
            <p className="mt-4 text-muted-foreground">
              All classes included. No hidden fees.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-foreground py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-black text-white sm:text-4xl uppercase tracking-tight">
              Ready to Start Training?
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              View our class schedule and book your first session today.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild data-testid="button-services-sessions">
                <Link href="/sessions">
                  View Class Schedule
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild data-testid="button-services-contact">
                <Link href="/contact">
                  Contact Us
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
