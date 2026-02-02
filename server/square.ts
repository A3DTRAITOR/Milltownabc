import { SquareClient, SquareEnvironment } from "square";
import crypto from "crypto";

// TODO: Replace sandbox keys with live keys for production
// Get Square sandbox keys from: squareup.com/gb/en → Developer Dashboard → Sandbox environment

// Detect sandbox mode by checking if Application ID starts with "sandbox-"
const isSandboxMode = (process.env.SQUARE_APPLICATION_ID || "").trim().startsWith("sandbox-");

const squareClient = new SquareClient({
  token: (process.env.SQUARE_ACCESS_TOKEN || "").trim(),
  environment: isSandboxMode 
    ? SquareEnvironment.Sandbox 
    : SquareEnvironment.Production,
});

export interface CreatePaymentParams {
  sourceId: string; // Token from Square Web Payments SDK
  amount: number; // Amount in pence (500 = £5.00)
  currency?: string;
  customerId?: string;
  note?: string;
  bookingId?: string;
}

export async function createPayment(params: CreatePaymentParams) {
  const { sourceId, amount, currency = "GBP", customerId, note, bookingId } = params;
  
  try {
    const response = await squareClient.payments.create({
      sourceId,
      idempotencyKey: crypto.randomUUID(),
      amountMoney: {
        amount: BigInt(amount), // Amount in smallest currency unit (pence for GBP)
        currency: currency as "GBP" | "USD" | "EUR",
      },
      customerId,
      note: note || `Mill Town ABC - Class Booking ${bookingId || ""}`,
      referenceId: bookingId,
    });

    if (response.payment) {
      return {
        success: true,
        paymentId: response.payment.id,
        status: response.payment.status,
        receiptUrl: response.payment.receiptUrl,
      };
    }

    return {
      success: false,
      error: "Payment creation failed",
    };
  } catch (error: any) {
    console.error("Square payment error:", error);
    return {
      success: false,
      error: error.message || "Payment failed",
    };
  }
}

export async function createCustomer(email: string, name: string, phone?: string) {
  try {
    const response = await squareClient.customers.create({
      idempotencyKey: crypto.randomUUID(),
      emailAddress: email,
      givenName: name.split(" ")[0],
      familyName: name.split(" ").slice(1).join(" ") || undefined,
      phoneNumber: phone || undefined,
    });

    if (response.customer) {
      return {
        success: true,
        customerId: response.customer.id,
      };
    }

    return {
      success: false,
      error: "Customer creation failed",
    };
  } catch (error: any) {
    console.error("Square customer error:", error);
    return {
      success: false,
      error: error.message || "Customer creation failed",
    };
  }
}

export function isSquareConfigured(): boolean {
  return !!(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_APPLICATION_ID && process.env.SQUARE_LOCATION_ID);
}

export function getSquareApplicationId(): string {
  return (process.env.SQUARE_APPLICATION_ID || "").trim();
}

export function getSquareLocationId(): string {
  return (process.env.SQUARE_LOCATION_ID || "").trim();
}

export { squareClient };
