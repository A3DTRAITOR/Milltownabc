import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowRight, Dumbbell, Users, Trophy, Clock, Calendar, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PageContent, SiteSettings } from "@shared/schema";
import heroImage from "@assets/stock_images/boxing_gym_training__1b00619a.jpg";

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
    metaTitle: "Milltown Boxing Club - Train Hard, Fight Smart",
    metaDescription: "Join Milltown Boxing Club for professional boxing training. Classes for all levels from beginners to advanced fighters. £15 per session.",
    heroTitle: "Train Hard. Fight Smart.",
    heroSubtitle: "Welcome to Milltown Boxing Club - where champions are made. Whether you're stepping into the ring for the first time or looking to sharpen your skills, our world-class trainers will help you reach your potential.",
    sections: [
      {
        id: "offerings",
        type: "cards",
        title: "What We Offer",
        items: [
          { title: "Boxing Fundamentals", description: "Master the basics of stance, footwork, and punching technique. Perfect for beginners looking to build a solid foundation.", icon: "dumbbell" },
          { title: "Fitness Boxing", description: "High-intensity workouts combining boxing movements with cardio training. Get fit, build strength, and relieve stress.", icon: "users" },
          { title: "Advanced Training", description: "Technical sparring, combination work, and competition preparation for experienced boxers ready to take it to the next level.", icon: "trophy" },
        ],
      },
    ],
  };

  const content = page || defaultContent;

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case "dumbbell": return <Dumbbell className="h-8 w-8" />;
      case "users": return <Users className="h-8 w-8" />;
      case "trophy": return <Trophy className="h-8 w-8" />;
      case "clock": return <Clock className="h-8 w-8" />;
      case "calendar": return <Calendar className="h-8 w-8" />;
      default: return <Dumbbell className="h-8 w-8" />;
    }
  };

  if (pageLoading || settingsLoading) {
    return (
      <PublicLayout settings={settings}>
        <div className="min-h-[600px] bg-foreground">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <Skeleton className="h-16 w-3/4 mb-6 bg-muted/20" />
            <Skeleton className="h-6 w-1/2 mb-8 bg-muted/20" />
            <div className="flex gap-4">
              <Skeleton className="h-12 w-32 bg-muted/20" />
              <Skeleton className="h-12 w-32 bg-muted/20" />
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const seoTitle = content.metaTitle || `${settings?.businessName || "Milltown Boxing Club"} - Train Hard, Fight Smart`;
  const seoDescription = content.metaDescription || content.heroSubtitle || "Professional boxing training for all levels.";

  return (
    <PublicLayout settings={settings}>
      <SEOHead title={seoTitle} description={seoDescription} />
      
      {/* Hero Section - Dark, Bold with Image */}
      <section className="relative min-h-[600px] lg:min-h-[700px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50" />
        
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1 mb-6 text-sm font-semibold tracking-wider text-primary uppercase bg-primary/10 rounded-full">
              Milltown Boxing Club
            </span>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-7xl uppercase" data-testid="text-hero-title">
              {content.heroTitle}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-gray-300 lg:text-xl" data-testid="text-hero-subtitle">
              {content.heroSubtitle}
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" asChild data-testid="button-hero-sessions">
                <Link href="/sessions">
                  View Classes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild data-testid="button-hero-register">
                <Link href="/register">
                  Join Now - £15/Session
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-primary text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-black">10+</div>
              <div className="mt-1 text-sm uppercase tracking-wider opacity-80">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black">500+</div>
              <div className="mt-1 text-sm uppercase tracking-wider opacity-80">Members Trained</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black">6</div>
              <div className="mt-1 text-sm uppercase tracking-wider opacity-80">Weekly Classes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black">£15</div>
              <div className="mt-1 text-sm uppercase tracking-wider opacity-80">Per Session</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {content.sections?.map((section) => (
        <section key={section.id} className="py-16 lg:py-24 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {section.title && (
              <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl uppercase tracking-tight" data-testid={`text-section-${section.id}-title`}>
                {section.title}
              </h2>
            )}
            
            {section.type === "cards" && section.items && (
              <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item, index) => (
                  <Card key={index} className="group p-6 lg:p-8 hover-elevate transition-all duration-300 border-2" data-testid={`card-feature-${index}`}>
                    <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
                      {getIcon(item.icon)}
                    </div>
                    <h3 className="text-xl font-bold text-foreground uppercase">{item.title}</h3>
                    <p className="mt-2 text-muted-foreground">{item.description}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}

      {/* CTA Section */}
      <section className="bg-foreground py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-black text-white sm:text-4xl uppercase tracking-tight">
              Ready to Start Training?
            </h2>
            <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
              Join Milltown Boxing Club today. All experience levels welcome. Your first step to becoming a better fighter starts here.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild data-testid="button-cta-schedule">
                <Link href="/sessions">
                  View Class Schedule
                  <Calendar className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild data-testid="button-cta-register">
                <Link href="/register">
                  Create Your Account
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
