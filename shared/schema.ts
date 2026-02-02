import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

// Member accounts for boxing club
export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  age: integer("age"),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  experienceLevel: varchar("experience_level", { length: 50 }).default("beginner"),
  isAdmin: boolean("is_admin").default(false),
  hasUsedFreeSession: boolean("has_used_free_session").default(false),
  squareCustomerId: varchar("square_customer_id", { length: 255 }),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Boxing classes/sessions
export const boxingClasses = pgTable("boxing_classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  classType: varchar("class_type", { length: 100 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  time: varchar("time", { length: 10 }).notNull(),
  duration: integer("duration").default(60),
  capacity: integer("capacity").default(12),
  bookedCount: integer("booked_count").default(0),
  price: decimal("price", { precision: 10, scale: 2 }).default("15.00"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings linking members to classes
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull().references(() => members.id),
  classId: varchar("class_id").notNull().references(() => boxingClasses.id),
  squarePaymentId: varchar("square_payment_id", { length: 255 }),
  paymentMethod: varchar("payment_method", { length: 20 }).default("card"),
  status: varchar("status", { length: 50 }).default("pending"),
  isFreeSession: boolean("is_free_session").default(false),
  price: decimal("price", { precision: 10, scale: 2 }).default("5.00"),
  bookedAt: timestamp("booked_at").defaultNow(),
});

export const insertMemberSchema = createInsertSchema(members).omit({ id: true, createdAt: true, squareCustomerId: true, emailVerificationToken: true, emailVerified: true });
export const insertBoxingClassSchema = createInsertSchema(boxingClasses).omit({ id: true, createdAt: true, bookedCount: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, bookedAt: true });

export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;
export type InsertBoxingClass = z.infer<typeof insertBoxingClassSchema>;
export type BoxingClass = typeof boxingClasses.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export const siteContent = pgTable("site_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 100 }).notNull().unique(),
  content: jsonb("content").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImage: varchar("featured_image", { length: 500 }),
  metaTitle: varchar("meta_title", { length: 60 }),
  metaDescription: varchar("meta_description", { length: 160 }),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mediaFiles = pgTable("media_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  size: varchar("size").notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  width: varchar("width"),
  height: varchar("height"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertSiteContentSchema = createInsertSchema(siteContent).omit({ id: true, updatedAt: true });
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMediaFileSchema = createInsertSchema(mediaFiles).omit({ id: true, uploadedAt: true });

export type InsertSiteContent = z.infer<typeof insertSiteContentSchema>;
export type SiteContent = typeof siteContent.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertMediaFile = z.infer<typeof insertMediaFileSchema>;
export type MediaFile = typeof mediaFiles.$inferSelect;

export const pageContentSchema = z.object({
  title: z.string(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
  heroImage: z.string().optional(),
  sections: z.array(z.object({
    id: z.string(),
    type: z.enum(["text", "image", "cards", "cta", "contact"]),
    title: z.string().optional(),
    content: z.string().optional(),
    items: z.array(z.object({
      title: z.string(),
      description: z.string(),
      icon: z.string().optional(),
      image: z.string().optional(),
    })).optional(),
  })).optional(),
});

export type PageContent = z.infer<typeof pageContentSchema>;

export const siteSettingsSchema = z.object({
  businessName: z.string(),
  tagline: z.string().optional(),
  logo: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  socialLinks: z.object({
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
  }).optional(),
  localBusiness: z.object({
    type: z.string().optional(),
    priceRange: z.string().optional(),
    openingHours: z.string().optional(),
  }).optional(),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;
