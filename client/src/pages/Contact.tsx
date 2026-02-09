import { useQuery, useMutation } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { SiteSettings } from "@shared/schema";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const { toast } = useToast();

  const { data: settingsData, isLoading: settingsLoading } = useQuery<{ content: SiteSettings }>({
    queryKey: ["/api/content", "settings"],
  });

  const settings = settingsData?.content;

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      return apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    contactMutation.mutate(data);
  };

  if (settingsLoading) {
    return (
      <PublicLayout settings={settings}>
        <div className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-12 w-1/3 mb-6" />
            <Skeleton className="h-6 w-2/3 mb-12" />
            <div className="grid gap-12 lg:grid-cols-2">
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const seoTitle = `Contact Mill Town ABC - Boxing Club Glossop | Whitfield Community Centre`;
  const seoDescription = "Contact Mill Town ABC boxing club in Glossop. Based at Whitfield Community Centre, Ebenezer Street, SK13 8JY. Call Alex: 07565 208193 or Mark: 07713 659360.";

  return (
    <PublicLayout settings={settings}>
      <SEOHead title={seoTitle} description={seoDescription} />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Contact", url: "/contact" }]} />
      <section className="bg-foreground py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1 mb-4 text-sm font-semibold tracking-wider text-primary uppercase bg-primary/10 rounded-full">
            Contact
          </span>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl uppercase" data-testid="text-contact-title">
            Get In Touch
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-gray-300 lg:text-xl" data-testid="text-contact-subtitle">
            Ready to start boxing? Whether you're curious about classes, want to arrange a trial session, or have any questions, we're here to help.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <Card className="p-6 lg:p-8">
                <h2 className="text-2xl font-semibold text-foreground mb-6">Send Me a Message</h2>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your name" {...field} data-testid="input-contact-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="your@email.com" {...field} data-testid="input-contact-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="Your phone number" {...field} data-testid="input-contact-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Private session inquiry, Class schedule question" {...field} data-testid="input-contact-subject" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us about your boxing experience, fitness goals, or any questions you have..." 
                              className="min-h-[150px] resize-none"
                              {...field} 
                              data-testid="input-contact-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full sm:w-auto" 
                      disabled={contactMutation.isPending}
                      data-testid="button-contact-submit"
                    >
                      {contactMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </Card>
            </div>

            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-6">Let's Connect</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-3 text-primary">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Email</h3>
                      <a href={`mailto:${settings?.email || "Milltownabc@gmail.com"}`} className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-contact-email">
                        {settings?.email || "Milltownabc@gmail.com"}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-3 text-primary">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Phone</h3>
                      {settings?.phone ? (
                        <a href={`tel:${settings.phone}`} className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-contact-phone">
                          {settings.phone}
                        </a>
                      ) : (
                        <div className="space-y-1">
                          <a href="tel:07565208193" className="block text-muted-foreground hover:text-primary transition-colors">
                            Alex: 07565 208193
                          </a>
                          <a href="tel:07713659360" className="block text-muted-foreground hover:text-primary transition-colors">
                            Mark: 07713 659360
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-3 text-primary">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Address</h3>
                      <p className="text-muted-foreground">{settings?.address || "Whitfield Community Centre, Ebenezer Street, Glossop, SK13 8JY"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-3">First Time Here?</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Your first session is FREE! All classes are just £5 per session after that. No experience necessary - just bring yourself, comfortable clothes, and an open mind. Our coaches welcome beginners and will help you get started.
                </p>
              </Card>
              
              <Card className="p-6 mt-4">
                <h3 className="font-semibold text-foreground mb-3">Find Us</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  <strong>Whitfield Community Centre</strong><br />
                  Ebenezer Street<br />
                  Glossop<br />
                  SK13 8JY
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
