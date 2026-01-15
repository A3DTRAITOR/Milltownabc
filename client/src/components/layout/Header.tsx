import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  isAdmin?: boolean;
}

export function Header({ businessName = "Milltown Boxing Club", logo }: HeaderProps) {
  const [location] = useLocation();

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
              <>
                {member.isAdmin && (
                  <Button asChild variant="outline" data-testid="link-admin">
                    <Link href="/admin">Admin</Link>
                  </Button>
                )}
                <Button asChild variant="default" data-testid="link-dashboard">
                  <Link href="/dashboard">
                    <User className="mr-2 h-4 w-4" />
                    My Account
                  </Link>
                </Button>
              </>
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

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                data-testid="button-mobile-menu"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col mt-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`py-4 text-lg font-semibold border-b transition-colors ${
                      location === link.href
                        ? "text-primary border-primary/20"
                        : "text-foreground border-border"
                    }`}
                    data-testid={`link-mobile-nav-${link.label.toLowerCase()}`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-6 flex flex-col gap-3">
                  {member ? (
                    <>
                      {member.isAdmin && (
                        <Button asChild size="lg" variant="outline" data-testid="link-mobile-admin">
                          <Link href="/admin">Admin Dashboard</Link>
                        </Button>
                      )}
                      <Button asChild size="lg" data-testid="link-mobile-dashboard">
                        <Link href="/dashboard">My Account</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild size="lg" variant="outline">
                        <Link href="/login">Login</Link>
                      </Button>
                      <Button asChild size="lg">
                        <Link href="/register">Join Now</Link>
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
