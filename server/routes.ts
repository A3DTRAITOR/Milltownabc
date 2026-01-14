import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { registerMemberRoutes } from "./memberAuth";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

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

  app.put("/api/content/:key", isAuthenticated, async (req, res) => {
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

  return httpServer;
}
