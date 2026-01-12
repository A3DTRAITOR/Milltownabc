import { Header } from "./Header";
import { Footer } from "./Footer";
import type { SiteSettings } from "@shared/schema";

interface PublicLayoutProps {
  children: React.ReactNode;
  settings?: SiteSettings;
}

export function PublicLayout({ children, settings }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header businessName={settings?.businessName} logo={settings?.logo} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
    </div>
  );
}
