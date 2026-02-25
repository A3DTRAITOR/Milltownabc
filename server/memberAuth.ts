import { Request, Response, NextFunction, Express } from "express";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import { z } from "zod";
import { verifyHCaptcha, checkSignupRateLimit, logSuspiciousActivity } from "./antiSpam";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email";

const SALT_ROUNDS = 12;

function getClientIP(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

function stripPhone(val: string): string {
  return val.replace(/[\s\-\(\)]/g, "");
}

const ukMobileRegex = /^(?:07\d{9}|\+447\d{9})$/;

const phoneValidation = z.string()
  .transform(stripPhone)
  .refine((val) => ukMobileRegex.test(val), {
    message: "Please enter a valid UK mobile number (e.g. 07123 456789 or +44 7123 456789)",
  });

const optionalPhoneValidation = z.string()
  .transform(stripPhone)
  .refine((val) => val === "" || ukMobileRegex.test(val), {
    message: "Please enter a valid UK mobile number (e.g. 07123 456789 or +44 7123 456789)",
  })
  .optional()
  .nullable();

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be under 100 characters"),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  phone: phoneValidation,
  age: z.number().min(1, "Please enter a valid age").max(100, "Please enter a valid age").optional().nullable(),
  emergencyContactName: z.string().trim().min(2, "Emergency contact name is required").max(100, "Name must be under 100 characters"),
  emergencyContactPhone: phoneValidation,
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password is too long"),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  hcaptchaToken: z.string().optional().nullable(),
  agreeToTerms: z.literal(true, { errorMap: () => ({ message: "You must agree to the Terms & Conditions and Privacy Policy" }) }),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

declare module "express-session" {
  interface SessionData {
    memberId?: string;
  }
}

export function isMemberAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session?.memberId) {
    return next();
  }
  return res.status(401).json({ message: "Not authenticated" });
}

export async function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.memberId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  const member = await storage.getMemberById(req.session.memberId);
  if (!member || !member.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  return next();
}

export function registerMemberRoutes(app: Express) {
  // Register new member
  app.post("/api/members/register", async (req, res) => {
    try {
      const ip = getClientIP(req);
      
      // Check signup rate limit (max 1 account per IP per day)
      if (!checkSignupRateLimit(req)) {
        return res.status(429).json({ 
          message: "Too many signup attempts from this location. Please try again tomorrow." 
        });
      }
      
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const { name, email, phone, age, emergencyContactName, emergencyContactPhone, password, experienceLevel, hcaptchaToken } = result.data;

      // Verify hCaptcha
      if (hcaptchaToken) {
        const captchaValid = await verifyHCaptcha(hcaptchaToken);
        if (!captchaValid) {
          logSuspiciousActivity(ip, "FAILED_CAPTCHA_SIGNUP", `Failed captcha for email: ${email}`);
          return res.status(400).json({ message: "Captcha verification failed. Please try again." });
        }
      } else if (process.env.HCAPTCHA_SECRET_KEY) {
        // Only require captcha if secret key is configured
        logSuspiciousActivity(ip, "MISSING_CAPTCHA_SIGNUP", `No captcha token for email: ${email}`);
        return res.status(400).json({ message: "Please complete the captcha verification" });
      }

      // Check if email already exists
      const existingMember = await storage.getMemberByEmail(email);
      if (existingMember) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Check if phone number already exists (prevents free session abuse)
      if (phone) {
        const existingPhone = await storage.getMemberByPhone(phone);
        if (existingPhone) {
          return res.status(400).json({ message: "This phone number is already registered to an account" });
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Generate email verification token
      const verificationToken = randomUUID();

      // Create member
      const member = await storage.createMember({
        name,
        email,
        phone: phone || null,
        age: age || null,
        emergencyContactName,
        emergencyContactPhone,
        passwordHash,
        experienceLevel,
      });

      // Update member with verification token
      await storage.updateMember(member.id, { 
        emailVerificationToken: verificationToken,
        emailVerified: false 
      });

      // Send verification email if SMTP is configured
      const protocol = req.protocol;
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;
      
      sendVerificationEmail({
        memberName: name,
        memberEmail: email,
        verificationToken,
        baseUrl,
      }).catch(err => console.error("Verification email error:", err));

      // Do NOT set session - user must verify email first
      res.status(201).json({
        message: "Registration successful! Please check your email to verify your account before logging in.",
        requiresVerification: true,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login
  app.post("/api/members/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const { email, password } = result.data;

      const member = await storage.getMemberByEmail(email);
      if (!member) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValid = await bcrypt.compare(password, member.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if email is verified
      if (!member.emailVerified) {
        return res.status(403).json({ 
          message: "Please verify your email before logging in. Check your inbox for the verification link.",
          requiresVerification: true
        });
      }

      req.session.memberId = member.id;

      res.json({
        id: member.id,
        name: member.name,
        email: member.email,
        experienceLevel: member.experienceLevel,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout
  app.post("/api/members/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Delete member account
  app.delete("/api/members/me", isMemberAuthenticated, async (req, res) => {
    try {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ message: "Password is required to delete account" });
      }

      const member = await storage.getMemberById(req.session.memberId!);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      const validPassword = await bcrypt.compare(password, member.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      const deleted = await storage.deleteMember(member.id);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete account" });
      }

      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
        res.json({ message: "Account deleted successfully" });
      });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Rate limiting for resend verification (track last resend time per email)
  const resendCooldowns = new Map<string, number>();
  const RESEND_COOLDOWN_MS = 60000; // 60 seconds

  // Resend verification email
  app.post("/api/members/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const member = await storage.getMemberByEmail(email);
      if (!member) {
        // Don't reveal if email exists for security
        return res.json({ message: "If this email is registered, a verification link has been sent." });
      }

      if (member.emailVerified) {
        return res.status(400).json({ message: "Email is already verified. You can log in now." });
      }

      // Check cooldown
      const lastResend = resendCooldowns.get(email);
      const now = Date.now();
      if (lastResend && (now - lastResend) < RESEND_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - (now - lastResend)) / 1000);
        return res.status(429).json({ 
          message: `Please wait ${remainingSeconds} seconds before requesting another email.`,
          retryAfter: remainingSeconds
        });
      }

      // Generate new verification token
      const verificationToken = randomUUID();
      await storage.updateMember(member.id, { 
        emailVerificationToken: verificationToken 
      });

      // Send verification email
      const protocol = req.protocol;
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;
      
      sendVerificationEmail({
        memberName: member.name,
        memberEmail: member.email,
        verificationToken,
        baseUrl,
      }).catch(err => console.error("Resend verification email error:", err));

      // Update cooldown
      resendCooldowns.set(email, now);

      res.json({ message: "Verification email sent! Please check your inbox." });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to resend verification email" });
    }
  });

  const resetCooldowns = new Map<string, number>();
  const RESET_COOLDOWN_MS = 60000;

  app.post("/api/members/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const lastReset = resetCooldowns.get(normalizedEmail);
      const now = Date.now();
      if (lastReset && (now - lastReset) < RESET_COOLDOWN_MS) {
        return res.json({ message: "If this email is registered, a password reset link has been sent." });
      }

      const member = await storage.getMemberByEmail(normalizedEmail);
      if (!member) {
        return res.json({ message: "If this email is registered, a password reset link has been sent." });
      }

      const resetToken = randomUUID();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

      await storage.updateMember(member.id, {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      });

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;

      sendPasswordResetEmail({
        memberName: member.name,
        memberEmail: member.email,
        resetToken,
        baseUrl,
      }).catch(err => console.error("Password reset email error:", err));

      resetCooldowns.set(normalizedEmail, now);

      res.json({ message: "If this email is registered, a password reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  app.post("/api/members/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      if (password.length > 128) {
        return res.status(400).json({ message: "Password is too long" });
      }

      const member = await storage.getMemberByResetToken(token);

      if (!member) {
        return res.status(400).json({ message: "Invalid or expired reset link. Please request a new one." });
      }

      if (!member.passwordResetExpires || new Date(member.passwordResetExpires) < new Date()) {
        await storage.updateMember(member.id, {
          passwordResetToken: null,
          passwordResetExpires: null,
        });
        return res.status(400).json({ message: "This reset link has expired. Please request a new one." });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      await storage.updateMember(member.id, {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      });

      res.json({ message: "Password has been reset successfully. You can now log in with your new password." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  // Get current member
  app.get("/api/members/me", isMemberAuthenticated, async (req, res) => {
    try {
      const member = await storage.getMemberById(req.session.memberId!);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      res.json({
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        experienceLevel: member.experienceLevel,
        isAdmin: member.isAdmin || false,
        hasUsedFreeSession: member.hasUsedFreeSession || false,
      });
    } catch (error) {
      console.error("Get member error:", error);
      res.status(500).json({ message: "Failed to get member" });
    }
  });

  // Update member profile
  app.patch("/api/members/me", isMemberAuthenticated, async (req, res) => {
    try {
      const { name, phone, experienceLevel } = req.body;
      if (phone) {
        const cleanedPhone = stripPhone(String(phone));
        if (!ukMobileRegex.test(cleanedPhone)) {
          return res.status(400).json({ message: "Please enter a valid UK mobile number (e.g. 07123 456789 or +44 7123 456789)" });
        }
      }
      const trimmedName = name ? String(name).trim().slice(0, 100) : undefined;
      const cleanedPhone = phone ? stripPhone(String(phone)) : undefined;
      const member = await storage.updateMember(req.session.memberId!, {
        name: trimmedName,
        phone: cleanedPhone,
        experienceLevel,
      });
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      res.json({
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        experienceLevel: member.experienceLevel,
      });
    } catch (error) {
      console.error("Update member error:", error);
      res.status(500).json({ message: "Failed to update member" });
    }
  });

  // Get upcoming classes
  app.get("/api/classes", async (_req, res) => {
    try {
      const classes = await storage.getUpcomingClasses();
      res.json(classes);
    } catch (error) {
      console.error("Get classes error:", error);
      res.status(500).json({ message: "Failed to get classes" });
    }
  });

  // Get single class
  app.get("/api/classes/:id", async (req, res) => {
    try {
      const boxingClass = await storage.getClass(req.params.id);
      if (!boxingClass) {
        return res.status(404).json({ message: "Class not found" });
      }
      res.json(boxingClass);
    } catch (error) {
      console.error("Get class error:", error);
      res.status(500).json({ message: "Failed to get class" });
    }
  });

  // NOTE: Booking route is now in routes.ts with anti-spam protection (hCaptcha + rate limiting)

  // Get member's bookings
  app.get("/api/members/me/bookings", isMemberAuthenticated, async (req, res) => {
    try {
      const bookings = await storage.getBookingsByMember(req.session.memberId!);
      
      // Get class details for each booking
      const bookingsWithDetails = await Promise.all(
        bookings.map(async (booking) => {
          const boxingClass = await storage.getClass(booking.classId);
          return { ...booking, class: boxingClass };
        })
      );
      
      res.json(bookingsWithDetails);
    } catch (error) {
      console.error("Get bookings error:", error);
      res.status(500).json({ message: "Failed to get bookings" });
    }
  });

  // Cancel booking
  app.delete("/api/bookings/:id", isMemberAuthenticated, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (booking.memberId !== req.session.memberId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Get the class to check the start time
      const boxingClass = await storage.getClass(booking.classId);
      
      // Calculate if cancellation is within 1 hour of class start
      let isWithinOneHour = false;
      if (boxingClass) {
        const classDateTime = new Date(`${boxingClass.date}T${boxingClass.time}:00`);
        const now = new Date();
        const oneHourBefore = new Date(classDateTime.getTime() - 60 * 60 * 1000);
        isWithinOneHour = now >= oneHourBefore;
      }

      await storage.cancelBooking(req.params.id);
      await storage.decrementBookedCount(booking.classId);

      // If this was a free session, only restore eligibility if cancelled more than 1 hour before
      let freeSessionRestored = false;
      if (booking.isFreeSession) {
        if (!isWithinOneHour) {
          await storage.updateMember(req.session.memberId!, { hasUsedFreeSession: false });
          freeSessionRestored = true;
        }
        // If within 1 hour, the free session is forfeited
      }

      res.json({ 
        message: "Booking cancelled",
        freeSessionRestored,
        freeSessionForfeited: booking.isFreeSession && !freeSessionRestored
      });
    } catch (error) {
      console.error("Cancel booking error:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // Admin: Create a new class (requires admin auth)
  app.post("/api/admin/classes", isAdmin, async (req, res) => {
    try {
      const { title, description, classType, date, time, duration, capacity, price, isActive } = req.body;
      
      if (!title || !classType || !date || !time) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const boxingClass = await storage.createClass({
        title,
        description,
        classType,
        date,
        time,
        duration: duration || 60,
        capacity: capacity || 12,
        price: price || "15.00",
        isActive: isActive !== false,
      });

      res.status(201).json(boxingClass);
    } catch (error) {
      console.error("Create class error:", error);
      res.status(500).json({ message: "Failed to create class" });
    }
  });

  // Admin: Update a class
  app.put("/api/admin/classes/:id", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, classType, date, time, duration, capacity, price, isActive } = req.body;
      
      const boxingClass = await storage.updateClass(id, {
        title,
        description,
        classType,
        date,
        time,
        duration,
        capacity,
        price,
        isActive,
      });

      if (!boxingClass) {
        return res.status(404).json({ message: "Class not found" });
      }

      res.json(boxingClass);
    } catch (error) {
      console.error("Update class error:", error);
      res.status(500).json({ message: "Failed to update class" });
    }
  });

  // Admin: Delete a class
  app.delete("/api/admin/classes/:id", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteClass(id);
      res.json({ message: "Class deleted" });
    } catch (error) {
      console.error("Delete class error:", error);
      res.status(500).json({ message: "Failed to delete class" });
    }
  });

  // Admin: Get all classes (including past)
  app.get("/api/admin/classes", isAdmin, async (_req, res) => {
    try {
      const classes = await storage.getAllClasses();
      res.json(classes);
    } catch (error) {
      console.error("Get all classes error:", error);
      res.status(500).json({ message: "Failed to get classes" });
    }
  });

  // Admin: Get dashboard stats
  app.get("/api/admin/stats", isAdmin, async (_req, res) => {
    try {
      const classes = await storage.getUpcomingClasses();
      const bookings = await storage.getAllBookings();
      const members = await storage.getAllMembers();
      
      // Classes this week
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const classesThisWeek = classes.filter(c => {
        const classDate = new Date(c.date);
        return classDate >= now && classDate <= weekFromNow;
      });
      
      // Active bookings
      const activeBookings = bookings.filter(b => b.status === 'confirmed');
      
      res.json({
        totalClasses: classes.length,
        classesThisWeek: classesThisWeek.length,
        totalBookings: activeBookings.length,
        totalMembers: members.length,
      });
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // Admin: Get all members
  app.get("/api/admin/members", isAdmin, async (_req, res) => {
    try {
      const members = await storage.getAllMembers();
      res.json(members.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        age: m.age,
        emergencyContactName: m.emergencyContactName,
        emergencyContactPhone: m.emergencyContactPhone,
        experienceLevel: m.experienceLevel,
        isAdmin: m.isAdmin,
        createdAt: m.createdAt,
      })));
    } catch (error) {
      console.error("Get members error:", error);
      res.status(500).json({ message: "Failed to get members" });
    }
  });

  // Admin: Edit a member's information
  app.patch("/api/admin/members/:id", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const member = await storage.getMemberById(id);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      const adminUpdateSchema = z.object({
        name: z.string().trim().min(2).max(100).optional(),
        email: z.string().trim().toLowerCase().email("Invalid email").optional(),
        phone: z.string().min(1, "Phone is required").optional(),
        age: z.number().min(1).max(100).optional().nullable(),
        emergencyContactName: z.string().trim().min(2).max(100).optional(),
        emergencyContactPhone: z.string().min(1).optional(),
        experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      });

      const parsed = adminUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid data" });
      }

      const updates: Record<string, any> = {};
      const data = parsed.data;

      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          updates[key] = value;
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      if (updates.email && updates.email !== member.email) {
        const existing = await storage.getMemberByEmail(updates.email);
        if (existing && existing.id !== id) {
          return res.status(400).json({ message: "Email already in use by another member" });
        }
      }

      if (updates.phone) {
        const ukMobileRegex = /^(?:07\d{9}|\+447\d{9})$/;
        const stripped = updates.phone.replace(/[\s\-\(\)]/g, "");
        if (!ukMobileRegex.test(stripped)) {
          return res.status(400).json({ message: "Please enter a valid UK mobile number" });
        }
        updates.phone = stripped;
        if (stripped !== member.phone) {
          const existing = await storage.getMemberByPhone(stripped);
          if (existing && existing.id !== id) {
            return res.status(400).json({ message: "Phone number already in use by another member" });
          }
        }
      }

      const updated = await storage.updateMember(id, updates);
      if (!updated) {
        return res.status(500).json({ message: "Failed to update member" });
      }

      res.json({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        age: updated.age,
        emergencyContactName: updated.emergencyContactName,
        emergencyContactPhone: updated.emergencyContactPhone,
        experienceLevel: updated.experienceLevel,
        isAdmin: updated.isAdmin,
        createdAt: updated.createdAt,
      });
    } catch (error) {
      console.error("Update member error:", error);
      res.status(500).json({ message: "Failed to update member" });
    }
  });

  // Admin: Delete a member (preserves paid booking records with redacted info)
  app.delete("/api/admin/members/:id", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const member = await storage.getMemberById(id);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Prevent admin from deleting themselves
      if (req.session.memberId === id) {
        return res.status(400).json({ message: "Cannot delete your own account from admin panel" });
      }
      
      const deleted = await storage.deleteMember(id);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete member" });
      }
      
      res.json({ message: "Member deleted successfully. Paid session records have been retained with personal information redacted." });
    } catch (error) {
      console.error("Delete member error:", error);
      res.status(500).json({ message: "Failed to delete member" });
    }
  });

  // Admin: Get all bookings with related class and member data
  app.get("/api/admin/bookings", isAdmin, async (_req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      const classes = await storage.getAllClasses();
      const members = await storage.getAllMembers();
      
      const classMap = new Map(classes.map(c => [c.id, c]));
      const memberMap = new Map(members.map(m => [m.id, { name: m.name, email: m.email }]));
      
      const enrichedBookings = bookings.map(b => ({
        ...b,
        class: classMap.get(b.classId) ? {
          title: classMap.get(b.classId)!.title,
          date: classMap.get(b.classId)!.date,
          time: classMap.get(b.classId)!.time,
          classType: classMap.get(b.classId)!.classType,
        } : undefined,
        member: b.memberId ? memberMap.get(b.memberId) : undefined,
      }));
      
      res.json(enrichedBookings);
    } catch (error) {
      console.error("Get all bookings error:", error);
      res.status(500).json({ message: "Failed to get bookings" });
    }
  });
}
