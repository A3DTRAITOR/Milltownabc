import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "";

if (typeof window !== "undefined" && GA_MEASUREMENT_ID) {
  (window as any)[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
}

function loadGoogleAnalytics() {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined") return;
  if (document.getElementById("ga-script")) return;

  (window as any)[`ga-disable-${GA_MEASUREMENT_ID}`] = false;

  const script = document.createElement("script");
  script.id = "ga-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(args);
  }
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
}

function removeGoogleAnalytics() {
  if (typeof window === "undefined") return;

  (window as any)[`ga-disable-${GA_MEASUREMENT_ID}`] = true;

  const script = document.getElementById("ga-script");
  if (script) script.remove();

  (window as any).dataLayer = [];

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const name = cookie.split("=")[0].trim();
    if (name.startsWith("_ga") || name.startsWith("_gid")) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  }
}

export function useInitAnalytics() {
  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (consent === "all") {
      loadGoogleAnalytics();
    }
  }, []);
}

export function isAnalyticsConsented(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("cookie-consent") === "all";
}

export function revokeConsent() {
  removeGoogleAnalytics();
  localStorage.removeItem("cookie-consent");
  window.location.reload();
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("cookie-consent", "all");
    setVisible(false);
    loadGoogleAnalytics();
  };

  const handleEssentialOnly = () => {
    localStorage.setItem("cookie-consent", "essential");
    setVisible(false);
    removeGoogleAnalytics();
  };

  if (!visible) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-foreground border-t border-border shadow-lg p-4 sm:p-6"
      role="alert"
      aria-label="Cookie consent"
      data-testid="banner-cookie-consent"
    >
      <div className="mx-auto max-w-4xl flex flex-col gap-4">
        <div>
          <p className="text-sm text-gray-300 leading-relaxed">
            This website uses essential cookies to keep you logged in, and analytics cookies (Google Analytics) to help us understand how the site is used. 
            You can accept all cookies or choose essential only. 
            See our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> for details.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button 
            onClick={handleEssentialOnly} 
            variant="outline"
            className="shrink-0 w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm border-gray-500 text-gray-300 hover:text-white hover:bg-gray-700"
            data-testid="button-essential-cookies"
          >
            Essential Only
          </Button>
          <Button 
            onClick={handleAcceptAll} 
            className="shrink-0 w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm"
            data-testid="button-accept-cookies"
          >
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}
