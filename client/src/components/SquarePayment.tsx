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
  onPaymentSuccess: (paymentToken: string, verificationToken?: string) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export function SquarePayment({ amount, onPaymentSuccess, onPaymentError, onCancel, isProcessing }: SquarePaymentProps) {
  const [card, setCard] = useState<any>(null);
  const [applePay, setApplePay] = useState<any>(null);
  const [googlePay, setGooglePay] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const applePayContainerRef = useRef<HTMLDivElement>(null);
  const googlePayContainerRef = useRef<HTMLDivElement>(null);
  const initializingRef = useRef(false);
  const paymentsRef = useRef<any>(null);
  const locationIdRef = useRef<string>("");

  useEffect(() => {
    let mounted = true;
    let payments: any = null;
    let cardInstance: any = null;
    let applePayInstance: any = null;
    let googlePayInstance: any = null;

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

        locationIdRef.current = config.locationId;

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
        paymentsRef.current = payments;
        
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
        }

        try {
          const applePayRequest = payments.paymentRequest({
            countryCode: 'GB',
            currencyCode: 'GBP',
            total: {
              amount: (amount / 100).toFixed(2),
              label: 'Mill Town ABC - Boxing Session',
            },
          });
          
          applePayInstance = await payments.applePay(applePayRequest);
          if (applePayInstance && applePayContainerRef.current && mounted) {
            await applePayInstance.attach(applePayContainerRef.current);
            setApplePay(applePayInstance);
            setApplePayAvailable(true);
          }
        } catch (appleErr) {
          console.log("Apple Pay not available:", appleErr);
        }

        try {
          const googlePayRequest = payments.paymentRequest({
            countryCode: 'GB',
            currencyCode: 'GBP',
            total: {
              amount: (amount / 100).toFixed(2),
              label: 'Mill Town ABC - Boxing Session',
            },
          });
          
          console.log("[Square] Attempting Google Pay init...");
          googlePayInstance = await payments.googlePay(googlePayRequest);
          console.log("[Square] Google Pay instance created:", !!googlePayInstance);
          if (googlePayInstance && googlePayContainerRef.current && mounted) {
            await googlePayInstance.attach(googlePayContainerRef.current);
            setGooglePay(googlePayInstance);
            setGooglePayAvailable(true);
            console.log("[Square] Google Pay attached successfully");
          }
        } catch (googleErr: any) {
          console.log("[Square] Google Pay not available:", googleErr?.message || googleErr);
        }

        if (mounted) {
          setLoading(false);
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
        try { cardInstance.destroy(); } catch (e) {}
      }
      if (applePayInstance) {
        try { applePayInstance.destroy(); } catch (e) {}
      }
      if (googlePayInstance) {
        try { googlePayInstance.destroy(); } catch (e) {}
      }
    };
  }, [amount]);

  const verifyBuyer = async (token: string): Promise<string | undefined> => {
    const payments = paymentsRef.current;
    if (!payments) return undefined;

    try {
      const verificationDetails = {
        amount: (amount / 100).toFixed(2),
        billingContact: {},
        currencyCode: 'GBP',
        intent: 'CHARGE',
      };

      const verificationResults = await payments.verifyBuyer(token, verificationDetails);
      return verificationResults?.token;
    } catch (err: any) {
      console.error("[Square] Buyer verification error:", err);
      return undefined;
    }
  };

  const handleCardPayment = async () => {
    if (!card) {
      onPaymentError("Payment form not ready");
      return;
    }

    try {
      const result = await card.tokenize();
      
      if (result.status === "OK") {
        const verificationToken = await verifyBuyer(result.token);
        onPaymentSuccess(result.token, verificationToken);
      } else {
        const errorMessage = result.errors?.[0]?.message || "Payment failed";
        onPaymentError(errorMessage);
      }
    } catch (err: any) {
      onPaymentError(err.message || "Payment processing failed");
    }
  };

  const handleApplePay = async () => {
    if (!applePay) return;

    try {
      const result = await applePay.tokenize();
      if (result.status === "OK") {
        const verificationToken = await verifyBuyer(result.token);
        onPaymentSuccess(result.token, verificationToken);
      } else {
        const errorMessage = result.errors?.[0]?.message || "Apple Pay failed";
        onPaymentError(errorMessage);
      }
    } catch (err: any) {
      onPaymentError(err.message || "Apple Pay failed");
    }
  };

  const handleGooglePay = async () => {
    if (!googlePay) return;

    try {
      const result = await googlePay.tokenize();
      if (result.status === "OK") {
        const verificationToken = await verifyBuyer(result.token);
        onPaymentSuccess(result.token, verificationToken);
      } else {
        const errorMessage = result.errors?.[0]?.message || "Google Pay failed";
        onPaymentError(errorMessage);
      }
    } catch (err: any) {
      onPaymentError(err.message || "Google Pay failed");
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
        <div className="flex items-center justify-center py-8" data-testid="payment-loading">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading payment options...</span>
        </div>
      )}

      {!loading && (applePayAvailable || googlePayAvailable) && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center font-medium">Express checkout</p>
          
          {applePayAvailable && (
            <div 
              ref={applePayContainerRef}
              onClick={handleApplePay}
              className="cursor-pointer"
              data-testid="apple-pay-button"
            />
          )}
          
          {googlePayAvailable && (
            <div 
              ref={googlePayContainerRef}
              onClick={handleGooglePay}
              className="cursor-pointer"
              data-testid="google-pay-button"
            />
          )}
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or pay with card</span>
            </div>
          </div>
        </div>
      )}

      <div className={loading ? 'hidden' : ''}>
        {!applePayAvailable && <div ref={applePayContainerRef} className="hidden" />}
        {!googlePayAvailable && <div ref={googlePayContainerRef} className="hidden" />}
      </div>
      
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
              onClick={handleCardPayment}
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
