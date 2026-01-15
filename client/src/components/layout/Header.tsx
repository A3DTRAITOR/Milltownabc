import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Training" },
  { href: "/sessions", label: "Classes" },
  { href: "/contact", label: "Contact" },
];

interface HeaderProps {
  businessName?: string;
  logo?: string;
}

interface MemberData {
  id: string;
  name: string;
}

export function Header({ businessName = "Milltown Boxing Club", logo }: HeaderProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: member } = useQuery<MemberData>({
    queryKey: ["/api/members/me"],
    retry: false,
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4 lg:h-20">
          <Link href="/" className="flex items-center gap-3 shrink-0" data-testid="link-home-logo">
            <img 
              src="/logo.png" 
              alt={businessName} 
              className="w-14 h-14 rounded-full object-cover bg-[#F5F5F5] p-1 shadow-md"
            />
          </Link>

          <nav className="hidden lg:flex lg:items-center lg:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === link.href
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
                data-testid={`link-nav-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex lg:items-center lg:gap-3">
            {member ? (
              <Button asChild variant="default" data-testid="link-dashboard">
                <Link href="/dashboard">
                  <User className="mr-2 h-4 w-4" />
                  My Account
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" data-testid="link-login">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild data-testid="link-register">
                  <Link href="/register">Join Now</Link>
                </Button>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-background lg:hidden">
          <nav className="flex flex-col p-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`py-4 text-lg font-medium border-b border-border transition-colors ${
                  location === link.href
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
                onClick={() => setMobileMenuOpen(false)}
                data-testid={`link-mobile-nav-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 flex flex-col gap-2">
              {member ? (
                <Button asChild onClick={() => setMobileMenuOpen(false)}>
                  <Link href="/dashboard">My Account</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/register">Join Now</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
