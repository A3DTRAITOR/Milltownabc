import { Request, Response, NextFunction } from "express";

const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET_KEY || "";
const HCAPTCHA_VERIFY_URL = "https://hcaptcha.com/siteverify";

// Rate limiting stores
const bookingRateLimit = new Map<string, { count: number; date: string }>();
const signupRateLimit = new Map<string, { count: number; date: string }>();
const suspiciousActivityLog: Array<{
  timestamp: Date;
  ip: string;
  type: string;
  details: string;
}> = [];

// Constants
const MAX_BOOKINGS_PER_IP_PER_DAY = 5;
const MAX_SIGNUPS_PER_IP = 5;

function getClientIP(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function logSuspiciousActivity(ip: string, type: string, details: string) {
  const entry = {
    timestamp: new Date(),
    ip,
    type,
    details,
  };
  suspiciousActivityLog.push(entry);
  console.warn(`[SECURITY] Suspicious activity from ${ip}: ${type} - ${details}`);
  
  // Keep only last 1000 entries to prevent memory issues
  if (suspiciousActivityLog.length > 1000) {
    suspiciousActivityLog.shift();
  }
}

export function getSuspiciousActivityLog() {
  return suspiciousActivityLog.slice(-100); // Return last 100 entries
}

export async function verifyHCaptcha(token: string): Promise<boolean> {
  if (!HCAPTCHA_SECRET) {
    console.warn("[HCAPTCHA] No secret key configured, skipping verification");
    return true; // Skip verification if no secret key (development mode)
  }

  try {
    const response = await fetch(HCAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: HCAPTCHA_SECRET,
        response: token,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("[HCAPTCHA] Verification error:", error);
    return false;
  }
}

export function checkBookingRateLimit(req: Request): { allowed: boolean; remaining: number } {
  const ip = getClientIP(req);
  const today = getTodayDate();
  
  const record = bookingRateLimit.get(ip);
  
  if (!record || record.date !== today) {
    bookingRateLimit.set(ip, { count: 1, date: today });
    return { allowed: true, remaining: MAX_BOOKINGS_PER_IP_PER_DAY - 1 };
  }
  
  if (record.count >= MAX_BOOKINGS_PER_IP_PER_DAY) {
    logSuspiciousActivity(ip, "BOOKING_RATE_LIMIT", `Exceeded ${MAX_BOOKINGS_PER_IP_PER_DAY} bookings/day`);
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: MAX_BOOKINGS_PER_IP_PER_DAY - record.count };
}

export function checkSignupRateLimit(req: Request): boolean {
  const ip = getClientIP(req);
  const today = getTodayDate();
  
  const record = signupRateLimit.get(ip);
  
  if (!record || record.date !== today) {
    signupRateLimit.set(ip, { count: 1, date: today });
    return true;
  }
  
  if (record.count >= MAX_SIGNUPS_PER_IP) {
    logSuspiciousActivity(ip, "SIGNUP_RATE_LIMIT", `Exceeded ${MAX_SIGNUPS_PER_IP} signups/IP/day`);
    return false;
  }
  
  record.count++;
  return true;
}

export function hcaptchaMiddleware(req: Request, res: Response, next: NextFunction) {
  return async () => {
    const { hcaptchaToken } = req.body;
    const ip = getClientIP(req);
    
    if (!hcaptchaToken) {
      logSuspiciousActivity(ip, "MISSING_CAPTCHA", "No hCaptcha token provided");
      return res.status(400).json({ message: "Please complete the captcha verification" });
    }
    
    const isValid = await verifyHCaptcha(hcaptchaToken);
    
    if (!isValid) {
      logSuspiciousActivity(ip, "FAILED_CAPTCHA", "hCaptcha verification failed");
      return res.status(400).json({ message: "Captcha verification failed. Please try again." });
    }
    
    next();
  };
}

// Clean up old rate limit entries daily
setInterval(() => {
  const today = getTodayDate();
  
  Array.from(bookingRateLimit.entries()).forEach(([ip, record]) => {
    if (record.date !== today) {
      bookingRateLimit.delete(ip);
    }
  });
  
  Array.from(signupRateLimit.entries()).forEach(([ip, record]) => {
    if (record.date !== today) {
      signupRateLimit.delete(ip);
    }
  });
}, 60 * 60 * 1000); // Run every hour
