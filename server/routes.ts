import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { registerMemberRoutes, isAdmin } from "./memberAuth";
import { sendBookingConfirmationEmail } from "./email";
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

      const sanitizedData = {
        name: sanitizeInput(String(name).slice(0, 100)),
        email: sanitizeInput(String(email).slice(0, 100)),
        phone: phone ? sanitizeInput(String(phone).slice(0, 20)) : undefined,
        subject: sanitizeInput(String(subject).slice(0, 200)),
        message: sanitizeInput(String(message).slice(0, 2000)),
      };

      console.log("Contact form submission:", sanitizedData);
      
      res.json({ success: true, message: "Message received" });
    } catch (error) {
      console.error("Error processing contact form:", error);
      res.status(500).json({ message: "Failed to process contact form" });
    }
  });

  // Class schedule templates - recurring weekly classes
  const classTemplates = [
    { dayOfWeek: 1, time: "17:30", title: "Beginners Class", classType: "beginners", duration: 60, description: "Perfect for those new to boxing. Learn fundamentals, technique, and fitness." },
    { dayOfWeek: 1, time: "17:45", title: "Senior & Carded Boxers", classType: "senior", duration: 135, description: "Advanced training for experienced and carded boxers." },
    { dayOfWeek: 3, time: "17:30", title: "Open Class Training", classType: "open", duration: 60, description: "Open training session for all experience levels." },
    { dayOfWeek: 6, time: "10:00", title: "Open Class Training", classType: "open", duration: 60, description: "Weekend open training session for all experience levels." },
  ];

  // Generate classes for the next N weeks
  async function generateWeeklyClasses(weeksAhead: number = 8) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let week = 0; week < weeksAhead; week++) {
      for (const template of classTemplates) {
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
            description: template.description,
            classType: template.classType,
            date: dateStr,
            time: template.time,
            duration: template.duration,
            capacity: 12,
            price: "5.00",
            isActive: true,
          });
        }
      }
    }
  }

  // Generate classes on server start
  generateWeeklyClasses(8).catch(console.error);

  // Get all upcoming classes
  app.get("/api/classes", async (_req, res) => {
    try {
      // Regenerate classes to ensure we always have 8 weeks ahead
      await generateWeeklyClasses(8);
      const classes = await storage.getUpcomingClasses();
      res.json(classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
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
      // Check if member is logged in via session
      const memberId = (req.session as any)?.memberId;
      if (!memberId) {
        return res.status(401).json({ message: "Please log in to book a class" });
      }

      const member = await storage.getMemberById(memberId);
      if (!member) {
        return res.status(401).json({ message: "Member not found" });
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

      // Create booking with price info
      // Free sessions are confirmed immediately, paid sessions are pending until Stripe is integrated
      const booking = await storage.createBooking({
        memberId,
        classId: req.params.id,
        status: isFreeSession ? "confirmed" : "pending",
        isFreeSession,
        price,
      });

      // If this was a free session, mark member as having used it
      if (isFreeSession) {
        await storage.updateMember(memberId, { hasUsedFreeSession: true });
      }

      await storage.incrementBookedCount(req.params.id);

      // Send confirmation email for all bookings
      const sessionDate = format(parseISO(boxingClass.date), "EEEE, MMMM d, yyyy");
      const sessionTime = boxingClass.time;
      
      sendBookingConfirmationEmail({
        memberName: member.name,
        memberEmail: member.email,
        sessionTitle: boxingClass.title,
        sessionDate,
        sessionTime,
        isFreeSession,
        price,
      }).catch(err => console.error("Email send error:", err));

      // TODO: Complete Stripe integration here
      // For paid sessions, would create Stripe checkout session:
      // const stripeSession = await stripe.checkout.sessions.create({
      //   payment_method_types: ['card'],
      //   line_items: [{ price_data: { currency: 'gbp', product_data: { name: boxingClass.title }, unit_amount: 500 }, quantity: 1 }],
      //   mode: 'payment',
      //   success_url: `${process.env.APP_URL}/dashboard?payment=success`,
      //   cancel_url: `${process.env.APP_URL}/sessions?payment=cancelled`,
      //   metadata: { bookingId: booking.id, memberId }
      // });
      // return res.json({ booking, checkoutUrl: stripeSession.url, requiresPayment: true });

      res.json({ 
        booking, 
        isFreeSession,
        price,
        requiresPayment: !isFreeSession,
        checkoutUrl: isFreeSession ? null : null, // TODO: Replace with Stripe checkout URL when integrated
        message: isFreeSession 
          ? "Your first session is FREE! A confirmation email has been sent." 
          : "Booking confirmed - £5 payment due at session. A confirmation email has been sent."
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

      await storage.cancelBooking(req.params.id);
      await storage.decrementBookedCount(booking.classId);

      res.json({ message: "Booking cancelled" });
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

  return httpServer;
}
