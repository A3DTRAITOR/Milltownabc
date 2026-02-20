import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-foreground border-t border-border shadow-lg p-4 sm:p-6"
      role="alert"
      aria-label="Cookie consent"
      data-testid="banner-cookie-consent"
    >
      <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-300 leading-relaxed">
            This website uses essential cookies to keep you logged in and remember your preferences. 
            We do not use any tracking or advertising cookies. 
            See our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> for details.
          </p>
        </div>
        <Button 
          onClick={accept} 
          className="shrink-0 w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm"
          data-testid="button-accept-cookies"
        >
          Got it
        </Button>
      </div>
    </div>
  );
}
