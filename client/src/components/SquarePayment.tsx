import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CreditCard, AlertCircle } from "lucide-react";

declare global {
  interface Window {
    Square: any;
  }
}

interface SquarePaymentProps {
  amount: number;
  onPaymentSuccess: (paymentToken: string) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export function SquarePayment({ amount, onPaymentSuccess, onPaymentError, onCancel, isProcessing }: SquarePaymentProps) {
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const initializingRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let payments: any = null;
    let cardInstance: any = null;

    const loadSquare = async () => {
      if (initializingRef.current) return;
      initializingRef.current = true;

      try {
        const configRes = await fetch("/api/square/config");
        const config = await configRes.json();

        if (!config.isConfigured) {
          if (mounted) {
            setError("Payment system not configured. Please contact support.");
            setLoading(false);
          }
          return;
        }

        if (!window.Square) {
          const script = document.createElement("script");
          script.src = config.sandboxMode
            ? "https://sandbox.web.squarecdn.com/v1/square.js"
            : "https://web.squarecdn.com/v1/square.js";
          script.async = true;
          
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Square script load timeout")), 15000);
            script.onload = () => {
              clearTimeout(timeout);
              resolve();
            };
            script.onerror = () => {
              clearTimeout(timeout);
              reject(new Error("Failed to load Square SDK"));
            };
            document.body.appendChild(script);
          });
        }

        if (!mounted) return;

        if (!window.Square) {
          throw new Error("Square SDK not available");
        }

        payments = window.Square.payments(config.applicationId, config.locationId);
        
        if (!payments) {
          throw new Error("Failed to initialize Square payments");
        }

        cardInstance = await payments.card();
        
        if (!cardInstance) {
          throw new Error("Failed to create card instance");
        }
        
        if (cardContainerRef.current && mounted) {
          await cardInstance.attach(cardContainerRef.current);
          setCard(cardInstance);
          setLoading(false);
        } else if (mounted) {
          throw new Error("Card container not available");
        }
      } catch (err: any) {
        console.error("Square initialization error:", err);
        if (mounted) {
          setError(err.message || "Failed to load payment form");
          setLoading(false);
        }
      }
    };

    loadSquare();

    return () => {
      mounted = false;
      if (cardInstance) {
        try {
          cardInstance.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  const handlePayment = async () => {
    if (!card) {
      onPaymentError("Payment form not ready");
      return;
    }

    try {
      const result = await card.tokenize();
      
      if (result.status === "OK") {
        onPaymentSuccess(result.token);
      } else {
        const errorMessage = result.errors?.[0]?.message || "Payment failed";
        onPaymentError(errorMessage);
      }
    } catch (err: any) {
      onPaymentError(err.message || "Payment processing failed");
    }
  };

  if (error) {
    return (
      <Card className="p-6" data-testid="card-payment-error">
        <div className="flex items-center gap-3 text-destructive mb-4">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
        <Button variant="outline" onClick={onCancel} className="w-full" data-testid="button-payment-cancel">
          Cancel
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="square-payment-form">
      <div className="text-center mb-4">
        <p className="text-2xl font-bold text-foreground">£{(amount / 100).toFixed(2)}</p>
        <p className="text-sm text-muted-foreground">Session fee</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4" data-testid="payment-loading">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading payment form...</span>
        </div>
      )}
      
      <div 
        ref={cardContainerRef} 
        className={`min-h-[50px] p-3 border rounded-md bg-background ${loading ? 'hidden' : ''}`}
        data-testid="square-card-container"
      />
      
      {!loading && (
        <>
          <p className="text-xs text-muted-foreground text-center">
            Secure payment powered by Square. We accept all major cards.
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1"
              data-testid="button-payment-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing || !card}
              className="flex-1"
              data-testid="button-payment-submit"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay £{(amount / 100).toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
