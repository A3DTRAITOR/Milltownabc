import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";

const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
});

type ForgotData = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const { toast } = useToast();
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const form = useForm<ForgotData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const forgotMutation = useMutation({
    mutationFn: async (data: ForgotData) => {
      const res = await fetch("/api/members/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Something went wrong");
      return json;
    },
    onSuccess: (data) => {
      setSent(true);
      setCooldown(60);
      toast({ title: "Check your email", description: data.message });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotData) => {
    forgotMutation.mutate(data);
  };

  return (
    <PublicLayout>
      <SEOHead
        title="Forgot Password - Mill Town ABC Boxing Club Glossop"
        description="Reset your Mill Town ABC account password."
      />

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
          <Card className="p-8 shadow-lg border-0 bg-card/80 backdrop-blur">
            {sent ? (
              <div className="text-center">
                <div className="mx-auto w-14 h-14 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-reset-sent-title">
                  Check Your Email
                </h1>
                <p className="text-sm text-muted-foreground mb-6">
                  If an account exists with that email, we've sent a password reset link. Check your inbox (and spam folder).
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (cooldown === 0) {
                      setSent(false);
                      forgotMutation.mutate(form.getValues());
                    }
                  }}
                  disabled={cooldown > 0 || forgotMutation.isPending}
                  className="w-full mb-3"
                  data-testid="button-resend-reset"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend reset email"}
                </Button>
                <Link href="/login" className="text-sm font-medium text-primary hover:underline" data-testid="link-back-to-login">
                  <ArrowLeft className="inline h-4 w-4 mr-1" />
                  Back to login
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <Mail className="h-7 w-7 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground" data-testid="text-forgot-title">
                    Forgot Password?
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Enter your email and we'll send you a link to reset your password
                  </p>
                </div>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Email Address</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="your@email.com"
                              className="h-11"
                              maxLength={255}
                              required
                              {...field}
                              data-testid="input-forgot-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full h-11 text-base font-semibold"
                      disabled={forgotMutation.isPending}
                      data-testid="button-forgot-submit"
                    >
                      {forgotMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                  </form>
                </Form>
                <div className="mt-6 pt-4 border-t border-border/50 text-center text-sm text-muted-foreground">
                  <Link href="/login" className="font-medium text-primary hover:underline" data-testid="link-back-to-login">
                    <ArrowLeft className="inline h-4 w-4 mr-1" />
                    Back to login
                  </Link>
                </div>
              </>
            )}
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
