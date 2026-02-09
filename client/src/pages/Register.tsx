import { useRef, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, UserPlus, Mail, CheckCircle } from "lucide-react";
import HCaptcha from "@hcaptcha/react-hcaptcha";

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || "";

const ukPhoneRegex = /^(?:\+44\s?\d{4}\s?\d{6}|0\d{10})$/;

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(1, "Phone number is required").regex(ukPhoneRegex, "Enter a valid UK mobile number"),
  age: z.number().min(5, "Age must be at least 5").max(100, "Please enter a valid age"),
  emergencyContactName: z.string().min(2, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(1, "Emergency contact phone is required").regex(ukPhoneRegex, "Enter a valid UK mobile number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterData = z.infer<typeof registerSchema>;

export default function Register() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);

  const form = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      age: undefined as unknown as number,
      emergencyContactName: "",
      emergencyContactPhone: "",
      password: "",
      confirmPassword: "",
      experienceLevel: "beginner",
    },
  });

  const watchAge = form.watch("age");

  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const { confirmPassword, ...submitData } = data;
      const res = await apiRequest("POST", "/api/members/register", {
        ...submitData,
        hcaptchaToken,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.requiresVerification) {
        setRegistrationSuccess(true);
        toast({ 
          title: "Check your email!", 
          description: "We've sent you a verification link. Please verify your email to complete registration." 
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/members/me"] });
        setLocation("/dashboard");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      captchaRef.current?.resetCaptcha();
      setHcaptchaToken(null);
    },
  });

  const onSubmit = (data: RegisterData) => {
    if (HCAPTCHA_SITE_KEY && !hcaptchaToken) {
      toast({
        title: "Please complete the captcha",
        description: "Verify you're human before registering",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate(data);
  };

  return (
    <PublicLayout>
      <SEOHead title="Join Mill Town ABC - Boxing Club Glossop | First Session FREE" description="Register at Mill Town ABC boxing club in Glossop. First session FREE, all classes just £5. Train at Whitfield Community Centre with ABA National Champion Alex Clegg." />
      
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
          {registrationSuccess ? (
            <Card className="p-8 text-center" data-testid="card-registration-success">
              <Mail className="h-16 w-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Check Your Email!</h1>
              <p className="text-muted-foreground mb-6">
                We've sent a verification link to your email address. Please click the link to verify your account before logging in.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Account created successfully</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>Verification email sent</span>
                </div>
              </div>
              <Button asChild className="mt-6" data-testid="button-go-login">
                <Link href="/login">Go to Login</Link>
              </Button>
            </Card>
          ) : (
            <>
              <Card className="p-8 shadow-lg border-0 bg-card/80 backdrop-blur">
                <div className="text-center mb-6">
                  <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <UserPlus className="h-7 w-7 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground" data-testid="text-register-title">
                    Join Mill Town ABC
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Register online, become a member, book sessions
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full text-sm font-semibold">
                    <CheckCircle className="h-4 w-4" />
                    First session FREE!
                  </div>
                </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" className="h-11" {...field} data-testid="input-register-name" />
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
                        <FormLabel className="text-sm font-medium">Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" className="h-11" {...field} data-testid="input-register-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="07XXX XXXXXX" className="h-11" {...field} data-testid="input-register-phone" />
                        </FormControl>
                        <FormDescription className="text-xs text-muted-foreground">e.g. 07123456789</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Age</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Your age"
                            className="h-11"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value || ""}
                            data-testid="input-register-age" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {watchAge && watchAge < 18 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md" data-testid="warning-under-18">
                    <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                      Guardian must attend first session to sign forms.
                    </p>
                  </div>
                )}
                <div className="border-t border-border/50 pt-5">
                  <p className="text-sm font-semibold text-foreground mb-4">Emergency Contact</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emergencyContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Contact Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Contact's full name" className="h-11" {...field} data-testid="input-register-emergency-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emergencyContactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Contact Phone</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="07XXX XXXXXX" className="h-11" {...field} data-testid="input-register-emergency-phone" />
                          </FormControl>
                          <FormDescription className="text-xs text-muted-foreground">e.g. 07123456789</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="experienceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Experience Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11" data-testid="select-register-experience">
                            <SelectValue placeholder="Select your level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner - New to boxing</SelectItem>
                          <SelectItem value="intermediate">General Training - Some experience</SelectItem>
                          <SelectItem value="advanced">Carded Boxer - Competitive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="border-t border-border/50 pt-5">
                  <p className="text-sm font-semibold text-foreground mb-4">Create Password</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Min 8 characters" className="h-11" autoComplete="new-password" {...field} data-testid="input-register-password" />
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
                            <Input type="password" placeholder="Confirm password" className="h-11" autoComplete="new-password" {...field} data-testid="input-register-confirm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {HCAPTCHA_SITE_KEY && (
                  <div className="flex justify-center" data-testid="captcha-register">
                    <HCaptcha
                      ref={captchaRef}
                      sitekey={HCAPTCHA_SITE_KEY}
                      onVerify={(token) => setHcaptchaToken(token)}
                      onExpire={() => setHcaptchaToken(null)}
                      onError={() => setHcaptchaToken(null)}
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold mt-2"
                  disabled={registerMutation.isPending}
                  data-testid="button-register-submit"
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>
            </Form>

                <div className="mt-6 pt-4 border-t border-border/50 text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="font-medium text-primary hover:underline" data-testid="link-login">
                    Sign in
                  </Link>
                </div>
              </Card>
            </>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
