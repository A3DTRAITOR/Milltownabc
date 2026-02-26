import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import type { SiteSettings } from "@shared/schema";

export default function Terms() {
  const { data: settingsData } = useQuery<{ content: SiteSettings }>({
    queryKey: ["/api/content", "settings"],
  });

  const settings = settingsData?.content;

  return (
    <PublicLayout settings={settings}>
      <SEOHead title="Terms & Conditions - Mill Town ABC Boxing Club Glossop" description="Terms and conditions for using the Mill Town ABC website, booking classes, and membership. Includes cancellation policy, refund process, and booking rules." />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Terms & Conditions", url: "/terms" }]} />

      <section className="bg-foreground py-12 lg:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black text-white uppercase tracking-tight sm:text-4xl" data-testid="text-terms-title">
            Terms & Conditions
          </h1>
          <p className="mt-2 text-gray-300">Last updated: February 2026</p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">1. About These Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms and conditions govern your use of the Mill Town ABC website and our class booking service. 
              By creating an account or booking a class, you agree to these terms. Mill Town ABC is based at 
              Whitfield Community Centre, Ebenezer Street, Glossop, SK13 8JY.
            </p>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">2. Membership & Accounts</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You must create an account to book classes. Registration requires your name, email, phone number, emergency contact details, and a password.</li>
              <li>You must verify your email address before you can book classes.</li>
              <li>You are responsible for keeping your login details secure. Do not share your account with others.</li>
              <li>Each person must have their own account. Only one account per phone number is permitted.</li>
              <li>You can delete your account at any time from your member dashboard. This will cancel any upcoming bookings and remove your personal data (booking records are anonymised for financial compliance).</li>
              <li>We reserve the right to suspend or remove accounts that are misused or created fraudulently.</li>
            </ul>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">3. Class Bookings</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>All boxing classes cost <strong className="text-foreground">£5 per session</strong>.</li>
              <li>Your <strong className="text-foreground">first session is FREE</strong>. This introductory offer is limited to one free session per person.</li>
              <li>You may have a maximum of <strong className="text-foreground">10 future bookings</strong> at any time. Cancel an existing booking to make room for a new one.</li>
              <li>You must be a registered, email-verified member to book a class.</li>
              <li>Sessions are held at Whitfield Community Centre, Ebenezer Street, Glossop, SK13 8JY.</li>
            </ul>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">4. Payment</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Card payments:</strong> Processed securely through Square. Your card details are handled entirely by Square and are never stored on our website.</li>
              <li><strong className="text-foreground">Cash payments:</strong> You can choose to pay £5 cash at reception when you arrive for your session. Cash bookings are held as pending until confirmed by a coach.</li>
              <li>All prices include any applicable taxes. There are no hidden fees or joining charges.</li>
            </ul>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">5. Cancellation & Refund Policy</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You can cancel a booking from your member dashboard at any time before the session.</li>
              <li><strong className="text-foreground">Free sessions:</strong> If you cancel more than 1 hour before the session start time, your free first session will be restored and you can use it on another booking. Cancellations within 1 hour of the session will forfeit your free session.</li>
              <li><strong className="text-foreground">Paid sessions (card):</strong> For refunds on card payments, please contact us at Milltownabc@gmail.com or speak to a coach at the gym. Refunds for cancellations made more than 1 hour before the session will be processed within a few days via your original payment method.</li>
              <li><strong className="text-foreground">Cash payments:</strong> If you paid cash and cancel before attending, please speak to a coach to arrange a refund or credit.</li>
              <li>Mill Town ABC reserves the right to cancel or reschedule classes due to unforeseen circumstances. If we cancel a class, any bookings will be cancelled and refunds arranged.</li>
            </ul>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">6. Health & Safety</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Boxing is a physical activity. You participate at your own risk and should ensure you are fit to take part.</li>
              <li>If you have any medical conditions, injuries, or concerns, please inform a coach before your session.</li>
              <li>You must follow all instructions given by coaches during training sessions.</li>
              <li>Emergency contact details are collected for your safety and will be used in the event of an emergency during a session.</li>
              <li>For members under 18, a parent or guardian should be aware of and consent to their participation.</li>
              <li>Please read our full <Link href="/safety" className="text-primary hover:underline">Safety Policy</Link> for more details.</li>
            </ul>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">7. Behaviour & Conduct</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>All members are expected to treat coaches, staff, and fellow members with respect.</li>
              <li>Any abusive, threatening, or antisocial behaviour will not be tolerated and may result in immediate removal from the gym and account suspension.</li>
              <li>The use of the website to create fraudulent bookings, multiple accounts, or to otherwise abuse the booking system may result in account removal.</li>
            </ul>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">8. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content on this website, including text, images, logos, and design, is the property of Mill Town ABC 
              or used with permission. You may not copy, reproduce, or distribute any content without our written consent.
            </p>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mill Town ABC provides this website and booking service on an "as is" basis. While we make every effort 
              to keep the website running smoothly and information accurate, we cannot guarantee uninterrupted access. 
              We are not liable for any loss or damage arising from your use of the website, except where such liability 
              cannot be excluded by law.
            </p>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">10. Your Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We take your privacy seriously. Please read our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> to 
              understand how we collect, use, and protect your personal data.
            </p>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">11. Changes to These Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these terms from time to time. Changes will be posted on this page with an updated date. 
              Continued use of the website after changes are posted constitutes acceptance of the updated terms.
            </p>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">12. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms are governed by the laws of England and Wales. Any disputes will be subject to the 
              exclusive jurisdiction of the courts of England and Wales.
            </p>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">13. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these terms, please contact us:
            </p>
            <ul className="list-none space-y-1 text-muted-foreground mt-3">
              <li><strong className="text-foreground">Email:</strong> Milltownabc@gmail.com</li>
              <li><strong className="text-foreground">Phone:</strong> Alex: 07565 208193 | Mark: 07713 659360</li>
              <li><strong className="text-foreground">Address:</strong> Mill Town ABC, Whitfield Community Centre, Ebenezer Street, Glossop, SK13 8JY</li>
            </ul>
          </Card>

        </div>
      </section>
    </PublicLayout>
  );
}
