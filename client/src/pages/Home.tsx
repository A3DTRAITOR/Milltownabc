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
    metaTitle: "Mill Town ABC - Boxing Club in Glossop",
    metaDescription: "Join Mill Town ABC for professional boxing training in Glossop. Classes for beginners, seniors, and carded boxers. All sessions just £5. First session FREE!",
    heroTitle: "Train Hard.\nFight Smart.",
    heroSubtitle: "Welcome to Mill Town ABC at Whitfield Community Centre, Glossop. Whether you're stepping into the ring for the first time or you're a carded boxer looking to sharpen your skills, our experienced coaches will help you reach your potential.",
    sections: [
      {
        id: "offerings",
        type: "cards",
        title: "What We Offer",
        items: [
          { title: "Beginner Classes", description: "Perfect for those new to boxing. Learn stance, footwork, and punching technique in a supportive environment. Mondays 17:30-18:30.", icon: "dumbbell" },
          { title: "Open Classes", description: "All skill levels welcome. Train alongside fellow boxers in our Wednesday and Saturday open sessions. Great for general fitness and technique.", icon: "users" },
          { title: "Senior & Carded Boxers", description: "Advanced training for experienced and competitive boxers. Technical sparring, combination work, and competition preparation. Mondays 18:45-20:00.", icon: "trophy" },
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

  const seoTitle = content.metaTitle || `${settings?.businessName || "Mill Town ABC"} - Train Hard, Fight Smart`;
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
              Mill Town ABC
            </span>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-7xl uppercase whitespace-pre-line" data-testid="text-hero-title">
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
                  Join Now - £5/Session
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
              <div className="text-4xl font-black">4</div>
              <div className="mt-1 text-sm uppercase tracking-wider opacity-80">Weekly Classes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black">£5</div>
              <div className="mt-1 text-sm uppercase tracking-wider opacity-80">Per Session</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black">FREE</div>
              <div className="mt-1 text-sm uppercase tracking-wider opacity-80">First Session</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black">£0</div>
              <div className="mt-1 text-sm uppercase tracking-wider opacity-80">Joining Fee</div>
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

      {/* Meet Your Coach Section */}
      <section className="py-16 lg:py-24 bg-card border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <span className="inline-block px-4 py-1 mb-4 text-sm font-semibold tracking-wider text-primary uppercase bg-primary/10 rounded-full">
                Head Coach
              </span>
              <h2 className="text-3xl font-black text-foreground sm:text-4xl uppercase tracking-tight">
                Alex Clegg
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Alex is an ex-amateur boxer who started training at age 8. With a wealth of competitive experience, he brings real ring knowledge to every session.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-3xl font-black text-primary">70+</div>
                  <div className="mt-1 text-sm text-muted-foreground">Amateur Bouts</div>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-3xl font-black text-primary">8x</div>
                  <div className="mt-1 text-sm text-muted-foreground">NW Champion</div>
                </div>
              </div>
              <ul className="mt-6 space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <Trophy className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>ABA National Champion</span>
                </li>
                <li className="flex items-start gap-3">
                  <Trophy className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Northwest Regional Team</span>
                </li>
                <li className="flex items-start gap-3">
                  <Trophy className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>3 Nations Championships</span>
                </li>
                <li className="flex items-start gap-3">
                  <Trophy className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>International victories vs Spain, Poland, Scotland, Ireland</span>
                </li>
              </ul>
              <div className="mt-8">
                <Button asChild data-testid="button-learn-more-coach">
                  <Link href="/about">
                    Learn More About Us
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
                <div className="text-center p-8">
                  <Users className="h-24 w-24 text-primary/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">Coach Photo Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 mb-4 text-sm font-semibold tracking-wider text-primary uppercase bg-primary/10 rounded-full">
              Testimonials
            </span>
            <h2 className="text-3xl font-black text-foreground sm:text-4xl uppercase tracking-tight">
              What Our Members Say
            </h2>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="p-6 lg:p-8">
              <div className="flex flex-col h-full">
                <div className="mb-4 text-primary">
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>
                <p className="text-muted-foreground leading-relaxed flex-grow">
                  "Training at Milltown has helped me have a goal and something to work towards. Milltown's helped me keep out of trouble and be apart of something that is more than just boxing. Milltown is like a family where I feel welcome and I feel like I could talk to anybody there."
                </p>
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="font-semibold text-foreground">Finley</p>
                  <p className="text-sm text-muted-foreground">Carded Boxer</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 lg:p-8">
              <div className="flex flex-col h-full">
                <div className="mb-4 text-primary">
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>
                <p className="text-muted-foreground leading-relaxed flex-grow">
                  "I cannot recommend Milltown Boxing enough! My son absolutely loves going, and the impact it's had on his life is amazing. Since joining, we've seen a massive improvement in his anxiety and his confidence. Mark and Alex are truly brilliant; they go above and beyond for every single child in that gym. It's more than just boxing—it's a supportive community that has helped him in ways I didn't think possible. Thank you, guys!"
                </p>
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="font-semibold text-foreground">Donna</p>
                  <p className="text-sm text-muted-foreground">Parent</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Sponsors Section */}
      <section className="py-12 lg:py-16 bg-card border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold text-foreground uppercase tracking-wider">
              Our Sponsors
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Thank you to our sponsors for supporting Mill Town ABC
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <a 
              href="https://www.compare-agents.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group p-6 bg-background rounded-lg border border-border hover-elevate transition-all"
              data-testid="link-sponsor-compare-agents"
            >
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">Compare Agents</h3>
              <p className="mt-2 text-sm text-muted-foreground">Instantly compare the service and performance of Estate agents near you.</p>
            </a>
            <a 
              href="https://tacao.co.uk" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group p-6 bg-background rounded-lg border border-border hover-elevate transition-all"
              data-testid="link-sponsor-tacao"
            >
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">Tacao</h3>
              <p className="mt-2 text-sm text-muted-foreground">Community and consultancy for entrepreneurs, business owners, and professionals.</p>
            </a>
            <a 
              href="https://highpeakworkwear.co.uk/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group p-6 bg-background rounded-lg border border-border hover-elevate transition-all"
              data-testid="link-sponsor-high-peak"
            >
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">High Peak Workwear</h3>
              <p className="mt-2 text-sm text-muted-foreground">High quality custom embroidered workwear for all trades.</p>
            </a>
            <a 
              href="https://www.coleherne.co.uk/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group p-6 bg-background rounded-lg border border-border hover-elevate transition-all"
              data-testid="link-sponsor-coleherne"
            >
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">Coleherne Group</h3>
              <p className="mt-2 text-sm text-muted-foreground">Specialist manufacture and repair of precision engineered components for industry.</p>
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-foreground py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-black text-white sm:text-4xl uppercase tracking-tight">
              Ready to Start Training?
            </h2>
            <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
              Join Mill Town ABC today. All experience levels welcome. Register online and your first session is FREE!
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
