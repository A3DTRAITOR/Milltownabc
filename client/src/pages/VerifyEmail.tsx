import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function VerifyEmail() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    fetch(`/api/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed. Please try again.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Verification failed. Please try again.");
      });
  }, []);

  return (
    <PublicLayout>
      <SEOHead 
        title="Verify Email - Mill Town ABC" 
        description="Verify your email address to complete registration" 
      />

      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
          <Card className="p-8 text-center" data-testid="card-verify-email">
            {status === "loading" && (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
                <h1 className="text-xl font-bold text-foreground mb-2">Verifying Email...</h1>
                <p className="text-muted-foreground">Please wait while we verify your email address.</p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-xl font-bold text-foreground mb-2">Email Verified!</h1>
                <p className="text-muted-foreground mb-6">{message}</p>
                <Button asChild data-testid="button-book-session">
                  <Link href="/sessions">Book Your First Session</Link>
                </Button>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <h1 className="text-xl font-bold text-foreground mb-2">Verification Failed</h1>
                <p className="text-muted-foreground mb-6">{message}</p>
                <Button asChild variant="outline" data-testid="button-contact">
                  <Link href="/contact">Contact Support</Link>
                </Button>
              </>
            )}
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
