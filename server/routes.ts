import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./auth_setup";
import { registerMemberRoutes, isAdmin } from "./memberAuth";
import { sendBookingConfirmationEmail, sendVerificationEmail, sendCancellationEmail } from "./email";
import { checkBookingRateLimit, verifyHCaptcha, logSuspiciousActivity, getSuspiciousActivityLog } from "./antiSpam";
import { createPayment, isSquareConfigured, getSquareApplicationId, getSquareLocationId } from "./square";

function getClientIP(req: any): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { format, parseISO } from "date-fns";

const UPLOAD_DIR = "./uploads";
const MAX_WIDTH = 1200;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const contactRateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;

function checkContactRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = contactRateLimit.get(ip);
  
  if (!record || now > record.resetTime) {
    contactRateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  record.count++;
  return true;
}

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use((req, res, next) => {
    const url = req.originalUrl;
    if (url !== "/" && url.endsWith("/") && !url.startsWith("/api/")) {
      const cleanUrl = url.slice(0, -1);
      return res.redirect(301, cleanUrl);
    }
    next();
  });

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  await setupAuth(app);
  registerAuthRoutes(app);
  registerMemberRoutes(app);

  app.get("/api/content/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const content = await storage.getContent(key);
      if (!content) {
        return res.json({ content: null });
      }
      res.json({ content: content.content });
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.put("/api/content/:key", isAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      let { content } = req.body;
      
      if (typeof content === "object") {
        Object.keys(content).forEach((k) => {
          if (typeof content[k] === "string") {
            content[k] = sanitizeInput(content[k]);
          }
        });
      }
      
      const result = await storage.upsertContent(key, content);
      res.json({ success: true, content: result.content });
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  app.get("/api/blog", async (_req, res) => {
    try {
      const posts = await storage.getAllBlogPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/blog/:idOrSlug", async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      let post = await storage.getBlogPost(idOrSlug);
      if (!post) {
        post = await storage.getBlogPostBySlug(idOrSlug);
      }
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.post("/api/blog", isAuthenticated, async (req, res) => {
    try {
      const { title, slug, excerpt, content, featuredImage, metaTitle, metaDescription, published } = req.body;
      
      if (!title || !slug || !content) {
        return res.status(400).json({ message: "Title, slug, and content are required" });
      }

      const existingPost = await storage.getBlogPostBySlug(slug);
      if (existingPost) {
        return res.status(400).json({ message: "A post with this slug already exists" });
      }

      const post = await storage.createBlogPost({
        title: sanitizeInput(title),
        slug: sanitizeInput(slug),
        excerpt: excerpt ? sanitizeInput(excerpt) : null,
        content: sanitizeInput(content),
        featuredImage: featuredImage || null,
        metaTitle: metaTitle ? sanitizeInput(metaTitle) : null,
        metaDescription: metaDescription ? sanitizeInput(metaDescription) : null,
        published: published || false,
      });
      
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating blog post:", error);
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  app.put("/api/blog/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { title, slug, excerpt, content, featuredImage, metaTitle, metaDescription, published } = req.body;

      const updateData: any = {};
      if (title) updateData.title = sanitizeInput(title);
      if (slug) updateData.slug = sanitizeInput(slug);
      if (excerpt !== undefined) updateData.excerpt = excerpt ? sanitizeInput(excerpt) : null;
      if (content) updateData.content = sanitizeInput(content);
      if (featuredImage !== undefined) updateData.featuredImage = featuredImage || null;
      if (metaTitle !== undefined) updateData.metaTitle = metaTitle ? sanitizeInput(metaTitle) : null;
      if (metaDescription !== undefined) updateData.metaDescription = metaDescription ? sanitizeInput(metaDescription) : null;
      if (published !== undefined) updateData.published = published;

      const post = await storage.updateBlogPost(id, updateData);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error updating blog post:", error);
      res.status(500).json({ message: "Failed to update blog post" });
    }
  });

  app.patch("/api/blog/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { published } = req.body;

      if (typeof published !== "boolean") {
        return res.status(400).json({ message: "Published must be a boolean" });
      }

      const post = await storage.updateBlogPost(id, { published });
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error updating blog post:", error);
      res.status(500).json({ message: "Failed to update blog post" });
    }
  });

  app.delete("/api/blog/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteBlogPost(id);
      if (!deleted) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  app.get("/api/media", async (_req, res) => {
    try {
      const media = await storage.getAllMedia();
      res.json(media);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ message: "Failed to fetch media" });
    }
  });

  app.post("/api/media/upload", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const originalName = req.file.originalname;
      const ext = path.extname(originalName).toLowerCase();
      const filename = `${randomUUID()}${ext}`;
      const filepath = path.join(UPLOAD_DIR, filename);

      let processedBuffer: Buffer;
      let metadata: sharp.Metadata;

      try {
        const image = sharp(req.file.buffer);
        metadata = await image.metadata();

        if (metadata.width && metadata.width > MAX_WIDTH) {
          processedBuffer = await image
            .resize(MAX_WIDTH, null, { withoutEnlargement: true })
            .toBuffer();
        } else {
          processedBuffer = req.file.buffer;
        }
      } catch (err) {
        processedBuffer = req.file.buffer;
        metadata = {} as sharp.Metadata;
      }

      fs.writeFileSync(filepath, processedBuffer);

      const url = `/uploads/${filename}`;
      const mediaFile = await storage.createMediaFile({
        filename,
        originalName,
        mimeType: req.file.mimetype,
        size: processedBuffer.length.toString(),
        url,
        width: metadata.width?.toString() || null,
        height: metadata.height?.toString() || null,
      });

      res.status(201).json(mediaFile);
    } catch (error) {
      console.error("Error uploading media:", error);
      res.status(500).json({ message: "Failed to upload media" });
    }
  });

  app.delete("/api/media/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const file = await storage.getMediaFile(id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      const filepath = path.join(UPLOAD_DIR, file.filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }

      await storage.deleteMediaFile(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting media:", error);
      res.status(500).json({ message: "Failed to delete media" });
    }
  });

  app.use("/uploads", (req, res, next) => {
    const filepath = path.join(UPLOAD_DIR, req.path);
    if (fs.existsSync(filepath)) {
      res.sendFile(path.resolve(filepath));
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      
      if (!checkContactRateLimit(clientIp)) {
        return res.status(429).json({ message: "Too many requests. Please try again later." });
      }
      
      const { name, email, phone, subject, message } = req.body;
      
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "Name, email, subject, and message are required" });
      }

      const trimmedName = String(name).trim();
      const trimmedEmail = String(email).trim().toLowerCase();
      const trimmedSubject = String(subject).trim();
      const trimmedMessage = String(message).trim();

      if (trimmedName.length < 2) {
        return res.status(400).json({ message: "Name must be at least 2 characters" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }

      if (trimmedSubject.length < 3) {
        return res.status(400).json({ message: "Subject must be at least 3 characters" });
      }

      if (trimmedMessage.length < 10) {
        return res.status(400).json({ message: "Message must be at least 10 characters" });
      }

      const ukMobileRegex = /^(?:07\d{9}|\+447\d{9})$/;
      let cleanedPhone: string | undefined;
      if (phone && String(phone).trim()) {
        cleanedPhone = String(phone).replace(/[\s\-\(\)]/g, "");
        if (!ukMobileRegex.test(cleanedPhone)) {
          return res.status(400).json({ message: "Please enter a valid UK mobile number (e.g. 07123 456789)" });
        }
      }

      const sanitizedData = {
        name: sanitizeInput(trimmedName.slice(0, 100)),
        email: sanitizeInput(trimmedEmail.slice(0, 255)),
        phone: cleanedPhone ? sanitizeInput(cleanedPhone) : undefined,
        subject: sanitizeInput(trimmedSubject.slice(0, 200)),
        message: sanitizeInput(trimmedMessage.slice(0, 2000)),
      };

      console.log("Contact form submission:", sanitizedData);
      
      res.json({ success: true, message: "Message received" });
    } catch (error) {
      console.error("Error processing contact form:", error);
      res.status(500).json({ message: "Failed to process contact form" });
    }
  });

  // Default class templates - seeded into database on first run
  const defaultTemplates = [
    { dayOfWeek: 1, time: "17:30", title: "Beginners Class", classType: "beginners", duration: 60, description: "Perfect for those new to boxing. Learn fundamentals, technique, and fitness." },
    { dayOfWeek: 1, time: "18:45", title: "Senior & Carded Boxers", classType: "senior", duration: 135, description: "Advanced training for experienced and carded boxers." },
    { dayOfWeek: 3, time: "17:30", title: "Open Class Training", classType: "open", duration: 60, description: "Open training session for all experience levels." },
    { dayOfWeek: 6, time: "10:00", title: "Open Class Training", classType: "open", duration: 60, description: "Weekend open training session for all experience levels." },
  ];

  // Seed default templates if none exist
  async function seedClassTemplates() {
    const existingTemplates = await storage.getAllClassTemplates();
    if (existingTemplates.length === 0) {
      for (const template of defaultTemplates) {
        await storage.createClassTemplate(template);
      }
      console.log("[Schedule] Seeded default class templates");
    }
  }

  // Generate classes for the next N weeks (default: 2 weeks to reduce clutter)
  async function generateWeeklyClasses(weeksAhead: number = 2) {
    const templates = await storage.getActiveClassTemplates();
    if (templates.length === 0) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let week = 0; week < weeksAhead; week++) {
      for (const template of templates) {
        const classDate = new Date(today);
        // Find the next occurrence of this day of week
        const currentDay = classDate.getDay();
        let daysUntil = template.dayOfWeek - currentDay;
        if (daysUntil < 0) daysUntil += 7;
        classDate.setDate(classDate.getDate() + daysUntil + (week * 7));
        
        const dateStr = classDate.toISOString().split('T')[0];
        
        // Check if class already exists for this date and time
        const existingClasses = await storage.getUpcomingClasses();
        const exists = existingClasses.some(c => c.date === dateStr && c.time === template.time);
        
        if (!exists) {
          await storage.createClass({
            title: template.title,
            description: template.description || "",
            classType: template.classType,
            date: dateStr,
            time: template.time,
            duration: template.duration || 60,
            capacity: 12,
            price: "5.00",
            isActive: true,
          });
        }
      }
    }
  }

  // Cleanup: Remove incorrect 17:45 Senior classes (should be 18:45)
  async function cleanupIncorrectClasses() {
    try {
      const allClasses = await storage.getUpcomingClasses();
      for (const cls of allClasses) {
        if (cls.classType === 'senior' && cls.time === '17:45') {
          await storage.deleteClass(cls.id);
          console.log(`[Cleanup] Removed incorrect 17:45 Senior class on ${cls.date}`);
        }
      }
    } catch (error) {
      console.error('[Cleanup] Error cleaning up classes:', error);
    }
  }

  // Generate classes on server start (seed templates, cleanup, then generate 2 weeks)
  seedClassTemplates()
    .then(() => cleanupIncorrectClasses())
    .then(() => generateWeeklyClasses(2))
    .catch(console.error);

  // Get all upcoming classes
  app.get("/api/classes", async (_req, res) => {
    try {
      // Regenerate classes to ensure we always have 2 weeks ahead
      await generateWeeklyClasses(2);
      const classes = await storage.getUpcomingClasses();
      res.json(classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  // Admin: Get class templates
  app.get("/api/admin/class-templates", isAdmin, async (_req, res) => {
    try {
      const templates = await storage.getAllClassTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching class templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  // Admin: Toggle class template active status
  app.patch("/api/admin/class-templates/:id/toggle", isAdmin, async (req, res) => {
    try {
      const template = await storage.getClassTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      const updated = await storage.updateClassTemplate(req.params.id, {
        isActive: !template.isActive
      });
      res.json(updated);
    } catch (error) {
      console.error("Error toggling template:", error);
      res.status(500).json({ message: "Failed to toggle template" });
    }
  });

  // Admin: Update class template
  app.patch("/api/admin/class-templates/:id", isAdmin, async (req, res) => {
    try {
      const { title, time, duration, description, isActive } = req.body;
      const updated = await storage.updateClassTemplate(req.params.id, {
        title, time, duration, description, isActive
      });
      if (!updated) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  // Admin: Create class template
  app.post("/api/admin/class-templates", isAdmin, async (req, res) => {
    try {
      const { dayOfWeek, time, title, classType, duration, description, isActive } = req.body;
      
      if (dayOfWeek === undefined || !time || !title || !classType || !duration) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const template = await storage.createClassTemplate({
        dayOfWeek: parseInt(dayOfWeek),
        time,
        title,
        classType,
        duration: parseInt(duration),
        description: description || null,
        isActive: isActive !== false
      });
      
      // Generate classes for this new template
      await generateWeeklyClasses(2);
      
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  // Admin: Delete class template
  app.delete("/api/admin/class-templates/:id", isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteClassTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Admin: Get all classes (including inactive)
  app.get("/api/admin/classes", isAdmin, async (_req, res) => {
    try {
      const classes = await storage.getAllClasses();
      res.json(classes);
    } catch (error) {
      console.error("Error fetching admin classes:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  // Admin: Create individual class
  app.post("/api/admin/classes", isAdmin, async (req, res) => {
    try {
      const { title, description, classType, date, time, duration, capacity, price, isActive } = req.body;
      if (!title || !date || !time) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const boxingClass = await storage.createClass({
        title,
        description: description || "",
        classType: classType || "open",
        date,
        time,
        duration: duration || 60,
        capacity: capacity || 12,
        price: price || "5.00",
        isActive: isActive !== false
      });
      res.status(201).json(boxingClass);
    } catch (error) {
      console.error("Error creating class:", error);
      res.status(500).json({ message: "Failed to create class" });
    }
  });

  // Admin: Update individual class
  app.put("/api/admin/classes/:id", isAdmin, async (req, res) => {
    try {
      const { title, description, classType, date, time, duration, capacity, price, isActive } = req.body;
      const updated = await storage.updateClass(req.params.id, {
        title,
        description,
        classType,
        date,
        time,
        duration,
        capacity,
        price,
        isActive
      });
      if (!updated) {
        return res.status(404).json({ message: "Class not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating class:", error);
      res.status(500).json({ message: "Failed to update class" });
    }
  });

  // Admin: Delete individual class
  app.delete("/api/admin/classes/:id", isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteClass(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Class not found" });
      }
      res.json({ message: "Class deleted successfully" });
    } catch (error) {
      console.error("Error deleting class:", error);
      res.status(500).json({ message: "Failed to delete class" });
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
      console.error("Error fetching class:", error);
      res.status(500).json({ message: "Failed to fetch class" });
    }
  });

  // Book a class (requires member authentication)
  app.post("/api/classes/:id/book", async (req, res) => {
    try {
      const ip = getClientIP(req);
      
      // Check booking rate limit (max 2 bookings per IP per day)
      const rateLimitResult = checkBookingRateLimit(req);
      if (!rateLimitResult.allowed) {
        return res.status(429).json({ 
          message: "Maximum booking limit reached for today. Please try again tomorrow." 
        });
      }
      
      // Verify hCaptcha if provided and configured
      const { hcaptchaToken, paymentToken, paymentMethod } = req.body;
      const isCashPayment = paymentMethod === "cash";
      // Only require captcha for free sessions (paid sessions go through payment instead)
      if (!paymentToken && !isCashPayment) {
        if (hcaptchaToken) {
          const captchaValid = await verifyHCaptcha(hcaptchaToken);
          if (!captchaValid) {
            logSuspiciousActivity(ip, "FAILED_CAPTCHA_BOOKING", `Failed captcha for class: ${req.params.id}`);
            return res.status(400).json({ message: "Captcha verification failed. Please try again." });
          }
        } else if (process.env.HCAPTCHA_SECRET_KEY) {
          logSuspiciousActivity(ip, "MISSING_CAPTCHA_BOOKING", `No captcha token for class: ${req.params.id}`);
          return res.status(400).json({ message: "Please complete the captcha verification" });
        }
      }
      
      // Check if member is logged in via session
      const memberId = (req.session as any)?.memberId;
      if (!memberId) {
        return res.status(401).json({ message: "Please log in to book a class" });
      }

      const member = await storage.getMemberById(memberId);
      if (!member) {
        return res.status(401).json({ message: "Member not found" });
      }

      // Check email verification (optional - only enforce if SMTP is configured)
      if (process.env.SMTP_USER && process.env.SMTP_PASS && !member.emailVerified) {
        return res.status(403).json({ 
          message: "Please verify your email address before booking. Check your inbox for the verification link." 
        });
      }

      const boxingClass = await storage.getClass(req.params.id);
      if (!boxingClass) {
        return res.status(404).json({ message: "Class not found" });
      }

      if (!boxingClass.isActive) {
        return res.status(400).json({ message: "This class is not available for booking" });
      }

      const capacity = boxingClass.capacity || 12;
      const bookedCount = boxingClass.bookedCount || 0;
      if (bookedCount >= capacity) {
        return res.status(400).json({ message: "This class is fully booked" });
      }

      // Check if already booked
      const existingBookings = await storage.getBookingsByMember(memberId);
      const alreadyBooked = existingBookings.some(b => b.classId === req.params.id && b.status !== "cancelled");
      if (alreadyBooked) {
        return res.status(400).json({ message: "You have already booked this class" });
      }

      // Check max 3 future bookings per user
      const today = new Date().toISOString().split('T')[0];
      const futureBookings = existingBookings.filter(b => {
        if (b.status === "cancelled") return false;
        const bookingClass = boxingClass; // We already have current class
        return b.classId !== req.params.id; // Will check all other bookings
      });
      
      // Get all future non-cancelled bookings count
      let futureBookingCount = 0;
      for (const b of existingBookings) {
        if (b.status === "cancelled") continue;
        const bClass = await storage.getClass(b.classId);
        if (bClass && bClass.date >= today) {
          futureBookingCount++;
        }
      }
      
      if (futureBookingCount >= 3) {
        return res.status(400).json({ 
          message: "Maximum of 3 future bookings allowed. Please cancel an existing booking to book a new class." 
        });
      }

      // Check if member has used their free session (using database flag)
      // Also check for prior confirmed bookings as a safety guard for existing members
      let isFreeSession = !member.hasUsedFreeSession;
      
      // Safety guard: If hasUsedFreeSession is false but they have prior confirmed bookings,
      // treat them as having used their free session (backfill protection)
      if (isFreeSession) {
        const confirmedBookings = existingBookings.filter(b => b.status === "confirmed");
        if (confirmedBookings.length > 0) {
          isFreeSession = false;
          // Also update the flag for future checks
          await storage.updateMember(memberId, { hasUsedFreeSession: true });
        }
      }
      
      const price = isFreeSession ? "0.00" : "5.00";

      // For paid sessions, process payment first if paymentToken is provided (or skip for cash)
      let paymentResult = null;
      if (!isFreeSession && !isCashPayment) {
        if (!paymentToken) {
          return res.status(400).json({ 
            message: "Payment required for this session. Please complete the payment form." 
          });
        }
        
        // Process Square payment
        const amount = 500; // £5.00 in pence
        console.log(`[Payment] Processing Square payment for member ${memberId}, class ${req.params.id}`);
        paymentResult = await createPayment({
          sourceId: paymentToken,
          amount,
          currency: "GBP",
          note: `Mill Town ABC - ${boxingClass.title} on ${boxingClass.date}`,
        });
        
        if (!paymentResult.success) {
          console.error(`[Payment] Failed:`, paymentResult.error);
          return res.status(400).json({ 
            message: paymentResult.error || "Payment failed. Please try again." 
          });
        }
        console.log(`[Payment] Success! Payment ID: ${paymentResult.paymentId}`);
      }

      // Create booking - confirmed if free or card payment succeeded, pending if cash
      const bookingStatus = isCashPayment ? "pending_cash" : "confirmed";
      const booking = await storage.createBooking({
        memberId,
        classId: req.params.id,
        status: bookingStatus,
        isFreeSession,
        price,
        squarePaymentId: paymentResult?.paymentId || null,
        paymentMethod: isCashPayment ? "cash" : "card",
      });

      // Mark member as having used free session
      if (isFreeSession) {
        await storage.updateMember(memberId, { hasUsedFreeSession: true });
      }

      await storage.incrementBookedCount(req.params.id);

      // Send confirmation email
      const sessionDate = format(parseISO(boxingClass.date), "EEEE, MMMM d, yyyy");
      const sessionTime = boxingClass.time;
      
      sendBookingConfirmationEmail({
        memberName: member.name,
        memberEmail: member.email,
        sessionTitle: boxingClass.title,
        sessionDate,
        sessionTime,
        isFreeSession,
        paymentType: isFreeSession ? 'free' : (isCashPayment ? 'cash' : 'card'),
        price,
      }).catch(err => console.error("Email send error:", err));

      res.json({ 
        booking, 
        isFreeSession,
        price,
        paymentId: paymentResult?.paymentId || null,
        paymentMethod: isCashPayment ? "cash" : "card",
        message: isFreeSession 
          ? "Your first session is FREE! A confirmation email has been sent." 
          : isCashPayment
            ? "Booking confirmed! Please pay £5 cash at reception before your session."
            : "Payment successful! Your booking is confirmed."
      });
    } catch (error) {
      console.error("Error booking class:", error);
      res.status(500).json({ message: "Failed to book class" });
    }
  });

  // Cancel booking
  app.delete("/api/bookings/:id", async (req, res) => {
    try {
      const memberId = (req.session as any)?.memberId;
      if (!memberId) {
        return res.status(401).json({ message: "Please log in" });
      }

      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.memberId !== memberId) {
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
          await storage.updateMember(memberId, { hasUsedFreeSession: false });
          freeSessionRestored = true;
        }
        // If within 1 hour, the free session is forfeited
      }

      // Send cancellation confirmation email
      const member = await storage.getMemberById(memberId);
      if (member && boxingClass) {
        const sessionDate = new Date(boxingClass.date + 'T00:00:00');
        const formattedDate = sessionDate.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });

        sendCancellationEmail({
          memberName: member.name,
          memberEmail: member.email,
          sessionTitle: boxingClass.title,
          sessionDate: formattedDate,
          sessionTime: boxingClass.time,
          freeSessionRestored
        }).catch(err => console.error("[Email] Failed to send cancellation email:", err));
      }

      res.json({ 
        message: "Booking cancelled",
        freeSessionRestored,
        freeSessionForfeited: booking.isFreeSession && !freeSessionRestored
      });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // Get member's bookings
  app.get("/api/members/me/bookings", async (req, res) => {
    try {
      const memberId = (req.session as any)?.memberId;
      if (!memberId) {
        return res.status(401).json({ message: "Please log in" });
      }

      const bookings = await storage.getBookingsByMember(memberId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Admin: Get suspicious activity log
  app.get("/api/admin/security-log", isAdmin, async (req, res) => {
    try {
      const logs = getSuspiciousActivityLog();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching security log:", error);
      res.status(500).json({ message: "Failed to fetch security log" });
    }
  });

  // Square payment processing endpoint
  // TODO: Replace sandbox keys with live keys for production
  app.post("/api/payments/process", async (req, res) => {
    try {
      const memberId = (req.session as any)?.memberId;
      if (!memberId) {
        return res.status(401).json({ message: "Please log in" });
      }

      const { bookingId, sourceId } = req.body;
      
      if (!bookingId || !sourceId) {
        return res.status(400).json({ message: "Missing booking ID or payment token" });
      }

      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.memberId !== memberId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      if (booking.status === "confirmed") {
        return res.status(400).json({ message: "Booking already confirmed" });
      }

      if (!isSquareConfigured()) {
        return res.status(503).json({ 
          message: "Payment processing not configured. Please contact the gym to pay in person.",
          sandboxMode: true 
        });
      }

      const amount = Math.round(parseFloat(booking.price || "5.00") * 100); // Convert to pence
      
      const paymentResult = await createPayment({
        sourceId,
        amount,
        currency: "GBP",
        bookingId,
        note: `Mill Town ABC - Class Booking`,
      });

      if (paymentResult.success) {
        await storage.updateBooking(bookingId, { 
          status: "confirmed",
          squarePaymentId: paymentResult.paymentId,
        });

        const member = await storage.getMemberById(memberId);
        const boxingClass = await storage.getClass(booking.classId);
        
        if (member && boxingClass) {
          const sessionDate = format(parseISO(boxingClass.date), "EEEE, MMMM d, yyyy");
          sendBookingConfirmationEmail({
            memberName: member.name,
            memberEmail: member.email,
            sessionTitle: boxingClass.title,
            sessionDate,
            sessionTime: boxingClass.time,
            isFreeSession: false,
            paymentType: 'card',
            price: booking.price || "5.00",
          }).catch(err => console.error("Email send error:", err));
        }

        return res.json({ 
          success: true, 
          message: "Payment successful! Your booking is confirmed.",
          receiptUrl: paymentResult.receiptUrl 
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          message: paymentResult.error || "Payment failed. Please try again." 
        });
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      res.status(500).json({ message: "Payment processing failed" });
    }
  });

  // Get Square configuration for frontend
  app.get("/api/square/config", async (req, res) => {
    const applicationId = getSquareApplicationId();
    // Detect sandbox mode by checking if Application ID starts with "sandbox-"
    const isSandbox = applicationId.startsWith("sandbox-");
    res.json({
      applicationId,
      locationId: getSquareLocationId(),
      isConfigured: isSquareConfigured(),
      sandboxMode: isSandbox,
    });
  });

  // Email verification endpoint
  app.get("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Invalid verification token" });
      }

      const member = await storage.getMemberByVerificationToken(token);
      if (!member) {
        return res.status(404).json({ message: "Invalid or expired verification link" });
      }

      await storage.updateMember(member.id, { 
        emailVerified: true, 
        emailVerificationToken: null 
      });

      res.json({ message: "Email verified successfully! You can now book classes." });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // Admin: Get all bookings with member/class details and payment info
  app.get("/api/admin/bookings", isAdmin, async (req, res) => {
    try {
      const allBookings = await storage.getAllBookings();
      
      // Get member and class details for each booking
      const bookingsWithDetails = await Promise.all(
        allBookings.map(async (booking) => {
          const member = booking.memberId ? await storage.getMemberById(booking.memberId) : null;
          const boxingClass = await storage.getClass(booking.classId);
          return {
            ...booking,
            member: member ? { name: member.name, email: member.email } : null,
            class: boxingClass ? { 
              title: boxingClass.title, 
              date: boxingClass.date, 
              time: boxingClass.time,
              classType: boxingClass.classType,
              duration: boxingClass.duration
            } : null,
          };
        })
      );

      res.json(bookingsWithDetails);
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Admin: Get all pending bookings
  app.get("/api/admin/pending-bookings", isAdmin, async (req, res) => {
    try {
      const allBookings = await storage.getAllBookings();
      const pendingBookings = allBookings.filter(b => b.status === "pending" || b.status === "pending_cash");
      
      // Get member and class details for each booking
      const bookingsWithDetails = await Promise.all(
        pendingBookings.map(async (booking) => {
          const member = booking.memberId ? await storage.getMemberById(booking.memberId) : null;
          const boxingClass = await storage.getClass(booking.classId);
          return {
            ...booking,
            memberName: member?.name || "Unknown",
            memberEmail: member?.email || "Unknown",
            className: boxingClass?.title || "Unknown",
            classDate: boxingClass?.date || "Unknown",
            classTime: boxingClass?.time || "Unknown",
          };
        })
      );

      res.json(bookingsWithDetails);
    } catch (error) {
      console.error("Error fetching pending bookings:", error);
      res.status(500).json({ message: "Failed to fetch pending bookings" });
    }
  });

  // Admin: Confirm a pending booking manually
  app.post("/api/admin/bookings/:id/confirm", isAdmin, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      await storage.updateBooking(req.params.id, { status: "confirmed" });
      
      res.json({ message: "Booking confirmed successfully" });
    } catch (error) {
      console.error("Error confirming booking:", error);
      res.status(500).json({ message: "Failed to confirm booking" });
    }
  });

  // Admin: Cancel a booking
  app.delete("/api/admin/bookings/:id", isAdmin, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      await storage.cancelBooking(req.params.id);
      await storage.decrementBookedCount(booking.classId);
      
      res.json({ message: "Booking cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // ===== SEO ROUTES =====

  // robots.txt
  app.get("/robots.txt", (_req, res) => {
    const domain = "https://milltownabc.co.uk";
    res.type("text/plain").send(
`User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/*
Disallow: /api/
Disallow: /dashboard

Sitemap: ${domain}/sitemap.xml`
    );
  });

  // sitemap.xml - dynamic with all public pages and blog posts
  app.get("/sitemap.xml", async (_req, res) => {
    const domain = "https://milltownabc.co.uk";
    const now = new Date().toISOString().split("T")[0];

    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "weekly" },
      { loc: "/about", priority: "0.8", changefreq: "monthly" },
      { loc: "/services", priority: "0.8", changefreq: "monthly" },
      { loc: "/sessions", priority: "0.9", changefreq: "daily" },
      { loc: "/safety", priority: "0.5", changefreq: "yearly" },
      { loc: "/blog", priority: "0.7", changefreq: "weekly" },
      { loc: "/contact", priority: "0.7", changefreq: "monthly" },
      { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
      { loc: "/terms", priority: "0.3", changefreq: "yearly" },
    ];

    let blogUrls = "";
    try {
      const posts = await storage.getAllBlogPosts();
      const publishedPosts = posts.filter((p: any) => p.published);
      for (const post of publishedPosts) {
        const lastmod = post.updatedAt
          ? new Date(post.updatedAt).toISOString().split("T")[0]
          : now;
        blogUrls += `
  <url>
    <loc>${domain}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
      }
    } catch (e) {
      // continue without blog posts
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    (p) => `  <url>
    <loc>${domain}${p.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("\n")}${blogUrls}
</urlset>`;

    res.type("application/xml").send(xml);
  });

  // Admin: Cancel multiple bookings (bulk cancel)
  app.post("/api/admin/bookings/bulk-cancel", isAdmin, async (req, res) => {
    try {
      const { bookingIds } = req.body;
      
      if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
        return res.status(400).json({ message: "No bookings specified" });
      }

      let cancelled = 0;
      for (const bookingId of bookingIds) {
        const booking = await storage.getBooking(bookingId);
        if (booking && booking.status !== "cancelled") {
          await storage.cancelBooking(bookingId);
          await storage.decrementBookedCount(booking.classId);
          cancelled++;
        }
      }

      res.json({ message: `${cancelled} booking(s) cancelled successfully` });
    } catch (error) {
      console.error("Error bulk cancelling bookings:", error);
      res.status(500).json({ message: "Failed to cancel bookings" });
    }
  });

  return httpServer;
}
