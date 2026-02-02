import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Loader2, LogIn, Mail, RefreshCw } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showResendOption, setShowResendOption] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const res = await fetch("/api/members/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        const error = new Error(json.message || "Login failed") as any;
        error.requiresVerification = json.requiresVerification;
        throw error;
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/me"] });
      toast({ title: "Welcome back!", description: "You've successfully logged in." });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      if (error.requiresVerification) {
        setShowResendOption(true);
        setResendEmail(form.getValues("email"));
      }
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch("/api/members/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        const error = new Error(json.message || "Failed to resend") as any;
        error.retryAfter = json.retryAfter;
        throw error;
      }
      return json;
    },
    onSuccess: (data) => {
      toast({ title: "Email sent!", description: data.message || "Check your inbox for the verification link." });
      setCooldown(60);
    },
    onError: (error: any) => {
      if (error.retryAfter) {
        setCooldown(error.retryAfter);
      }
      toast({
        title: "Could not send email",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const handleResend = () => {
    if (resendEmail && cooldown === 0) {
      resendMutation.mutate(resendEmail);
    }
  };

  return (
    <PublicLayout>
      <SEOHead title="Login - Mill Town ABC" description="Log in to your Mill Town ABC account to book classes and manage your sessions." />
      
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-login-title">
              Member Login
            </h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to book classes and view your schedule
            </p>
          </div>

          <Card className="p-8 shadow-lg border-0 bg-card/80 backdrop-blur">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your@email.com" className="h-11" {...field} data-testid="input-login-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your password" className="h-11" {...field} data-testid="input-login-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold mt-2"
                  disabled={loginMutation.isPending}
                  data-testid="button-login-submit"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {showResendOption && (
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Email not verified
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Check your inbox for the verification link, or request a new one.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={handleResend}
                      disabled={resendMutation.isPending || cooldown > 0}
                      data-testid="button-resend-verification"
                    >
                      {resendMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      {cooldown > 0 ? `Wait ${cooldown}s` : "Resend verification email"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline" data-testid="link-register">
                Register here
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
