import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

const resetSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password is too long"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetData = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const { toast } = useToast();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token");
  const [success, setSuccess] = useState(false);

  const form = useForm<ResetData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const resetMutation = useMutation({
    mutationFn: async (data: ResetData) => {
      const res = await fetch("/api/members/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Something went wrong");
      return json;
    },
    onSuccess: (data) => {
      setSuccess(true);
      toast({ title: "Password reset!", description: data.message });
    },
    onError: (error: any) => {
      toast({
        title: "Reset failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ResetData) => {
    resetMutation.mutate(data);
  };

  if (!token) {
    return (
      <PublicLayout>
        <SEOHead title="Reset Password - Mill Town ABC" description="Reset your password." />
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
            <Card className="p-8 shadow-lg border-0 bg-card/80 backdrop-blur text-center">
              <div className="mx-auto w-14 h-14 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-invalid-link">
                Invalid Reset Link
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                This password reset link is invalid or missing. Please request a new one.
              </p>
              <Link href="/forgot-password">
                <Button className="w-full" data-testid="button-request-new-reset">
                  Request New Reset Link
                </Button>
              </Link>
            </Card>
          </div>
        </section>
      </PublicLayout>
    );
  }

  if (success) {
    return (
      <PublicLayout>
        <SEOHead title="Password Reset - Mill Town ABC" description="Your password has been reset." />
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
            <Card className="p-8 shadow-lg border-0 bg-card/80 backdrop-blur text-center">
              <div className="mx-auto w-14 h-14 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-reset-success">
                Password Reset!
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                Your password has been changed. You can now log in with your new password.
              </p>
              <Link href="/login">
                <Button className="w-full" data-testid="button-go-to-login">
                  Go to Login
                </Button>
              </Link>
            </Card>
          </div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <SEOHead
        title="Reset Password - Mill Town ABC Boxing Club Glossop"
        description="Set a new password for your Mill Town ABC account."
      />

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
          <Card className="p-8 shadow-lg border-0 bg-card/80 backdrop-blur">
            <div className="text-center mb-6">
              <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <Lock className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-reset-title">
                Set New Password
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your new password below
              </p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="At least 8 characters"
                          className="h-11"
                          required
                          {...field}
                          data-testid="input-reset-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Re-enter your password"
                          className="h-11"
                          required
                          {...field}
                          data-testid="input-reset-confirm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold"
                  disabled={resetMutation.isPending}
                  data-testid="button-reset-submit"
                >
                  {resetMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
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
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
