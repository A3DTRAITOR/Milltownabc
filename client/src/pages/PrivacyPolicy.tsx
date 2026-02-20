import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Card } from "@/components/ui/card";
import type { SiteSettings } from "@shared/schema";

export default function PrivacyPolicy() {
  const { data: settingsData } = useQuery<{ content: SiteSettings }>({
    queryKey: ["/api/content", "settings"],
  });

  const settings = settingsData?.content;

  return (
    <PublicLayout settings={settings}>
      <SEOHead title="Privacy Policy - Mill Town ABC Boxing Club Glossop" description="How Mill Town ABC handles your personal data. Read our privacy policy covering data collection, storage, payments, and your rights under UK GDPR." />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Privacy Policy", url: "/privacy" }]} />

      <section className="bg-foreground py-12 lg:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black text-white uppercase tracking-tight sm:text-4xl" data-testid="text-privacy-title">
            Privacy Policy
          </h1>
          <p className="mt-2 text-gray-300">Last updated: February 2026</p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">1. Who We Are</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mill Town ABC is a boxing club based at Whitfield Community Centre, Ebenezer Street, Glossop, SK13 8JY. 
              We are the data controller for the personal information we collect through this website.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              <strong className="text-foreground">Contact:</strong> Milltownabc@gmail.com | Alex: 07565 208193 | Mark: 07713 659360
            </p>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">2. What Personal Data We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We collect the following information when you create a member account:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Full name</strong> - to identify you as a member</li>
              <li><strong className="text-foreground">Email address</strong> - for account login, booking confirmations, and cancellation notifications</li>
              <li><strong className="text-foreground">UK mobile phone number</strong> - for contact purposes and to prevent duplicate accounts</li>
              <li><strong className="text-foreground">Age</strong> (optional) - to help our coaches tailor sessions appropriately</li>
              <li><strong className="text-foreground">Emergency contact name and phone number</strong> - for your safety during training sessions</li>
              <li><strong className="text-foreground">Experience level</strong> - to recommend suitable classes (beginner, intermediate, or advanced)</li>
              <li><strong className="text-foreground">Password</strong> - stored securely using bcrypt hashing (we never store or see your actual password)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">When you book a class, we also record:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
              <li>Which class you booked and the date/time</li>
              <li>Payment method used (card or cash)</li>
              <li>Whether it was your free first session</li>
              <li>Payment reference (if paid by card via Square)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">When you use the contact form, we receive your name, email, phone (optional), subject, and message. Contact form submissions are sent to our email and are not stored in the website database.</p>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">3. Why We Collect Your Data (Lawful Basis)</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">Under UK GDPR, we process your personal data on the following lawful bases:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Contract</strong> - We need your data to provide our booking service, process payments, and manage your membership (Article 6(1)(b)).</li>
              <li><strong className="text-foreground">Legitimate interest</strong> - We collect emergency contact details for your safety during training, and we use phone number uniqueness to prevent abuse of our free first session offer (Article 6(1)(f)).</li>
              <li><strong className="text-foreground">Consent</strong> - When you submit our contact form, you consent to us using your details to respond to your enquiry. We also seek your consent before placing analytics cookies on your device (Article 6(1)(a)).</li>
            </ul>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">4. How We Use Your Data</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>To create and manage your member account</li>
              <li>To process class bookings and send confirmation emails</li>
              <li>To send cancellation confirmation emails when you cancel a booking</li>
              <li>To send email verification links when you register</li>
              <li>To process card payments securely through Square</li>
              <li>To ensure your safety by having emergency contact details available during sessions</li>
              <li>To respond to your contact form enquiries</li>
              <li>To maintain financial records for HMRC compliance</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We do <strong className="text-foreground">not</strong> use your data for marketing, sell it to third parties, or share it with anyone outside of the club's operations.
            </p>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">5. Payment Processing</h2>
            <p className="text-muted-foreground leading-relaxed">
              Card payments are processed securely by <strong className="text-foreground">Square</strong> (squareup.com). When you pay by card, your payment card details are handled entirely by Square and are never stored on our website or servers. We only receive a payment reference confirming the transaction was successful.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Square's privacy policy can be found at <a href="https://squareup.com/gb/en/legal/general/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">squareup.com/gb/en/legal/general/privacy</a>.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              You can also pay cash at reception when you arrive for your session. No card details are collected for cash payments.
            </p>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">6. Email Communications</h2>
            <p className="text-muted-foreground leading-relaxed">
              We send transactional emails only - these are directly related to actions you take on the website:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-3">
              <li>Email verification when you register</li>
              <li>Booking confirmation when you book a class</li>
              <li>Cancellation confirmation when you cancel a booking</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              We do not send marketing emails, newsletters, or promotional messages. Emails are sent using the Resend email service.
            </p>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">7. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              This website uses the following types of cookies:
            </p>
            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Essential Cookies</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">These are required for the site to function and cannot be switched off:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Session cookie</strong> (connect.sid) - Keeps you logged in while you use the site. This cookie is deleted when you log out or close your browser session.</li>
              <li><strong className="text-foreground">Cookie consent</strong> (cookie-consent) - Remembers your cookie preferences.</li>
            </ul>
            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Analytics Cookies</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">With your consent, we use Google Analytics to understand how visitors use our website. This helps us improve the site. Google Analytics sets the following cookies:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">_ga</strong> - Used to distinguish users. Expires after 2 years.</li>
              <li><strong className="text-foreground">_ga_*</strong> - Used to maintain session state. Expires after 2 years.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Google Analytics collects anonymised data about pages visited, time spent on the site, and how you arrived at the site. This data is processed by Google. You can opt out of analytics cookies at any time using our cookie banner, or by installing the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Analytics Opt-out Browser Add-on</a>.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              We do not use any advertising or marketing cookies.
            </p>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">8. Data Storage and Security</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Your data is stored in a secure PostgreSQL database</li>
              <li>Passwords are hashed using bcrypt and cannot be viewed or recovered by anyone, including us</li>
              <li>All connections to the website are encrypted using HTTPS/TLS</li>
              <li>Access to member data is restricted to club administrators only</li>
              <li>We use rate limiting to prevent abuse of forms and booking systems</li>
            </ul>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">9. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your member account and personal data are kept for as long as your account is active. 
              Booking records may be retained for up to 6 years after the booking date for HMRC financial record-keeping requirements, 
              even if your account is deleted. In that case, your personal details are redacted from booking records, 
              and only an anonymised reference and the financial transaction details are kept.
            </p>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">10. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">Under UK GDPR, you have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Right of access</strong> - You can view all the personal data we hold about you in your member dashboard.</li>
              <li><strong className="text-foreground">Right to rectification</strong> - You can contact us to update any incorrect information.</li>
              <li><strong className="text-foreground">Right to deletion</strong> - You can delete your account at any time from your member dashboard. This removes your personal data, with booking records anonymised for financial compliance.</li>
              <li><strong className="text-foreground">Right to data portability</strong> - You can request a copy of your personal data by contacting us.</li>
              <li><strong className="text-foreground">Right to object</strong> - You can object to how we process your data by contacting us.</li>
              <li><strong className="text-foreground">Right to complain</strong> - If you're unhappy with how we handle your data, you can complain to the Information Commissioner's Office (ICO) at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ico.org.uk</a> or call 0303 123 1113.</li>
            </ul>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">11. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Square</strong> - For processing card payments. Square handles all card data securely under PCI DSS compliance.</li>
              <li><strong className="text-foreground">Resend</strong> - For sending transactional emails (booking confirmations, email verification, cancellation notices).</li>
              <li><strong className="text-foreground">Google Analytics</strong> - For understanding how visitors use our website (with your consent). Google may process data outside the UK; Google is certified under the UK Extension to the EU-US Data Privacy Framework. See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google's Privacy Policy</a>.</li>
              <li><strong className="text-foreground">Google Search Console</strong> - For monitoring how the site appears in Google search results. This service does not collect personal data from visitors.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              We do not share your personal data with any other third parties beyond those listed above.
            </p>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">12. Children's Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mill Town ABC welcomes members of all ages. For members under 13, we require that a parent or guardian creates and manages the account. 
              The emergency contact details provided during registration serve as the parental/guardian contact for younger members.
            </p>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">13. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this privacy policy from time to time. Any changes will be posted on this page with an updated date. 
              We encourage you to review this page periodically.
            </p>
          </Card>

          <Card className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">14. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this privacy policy or how we handle your data, please contact us:
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
