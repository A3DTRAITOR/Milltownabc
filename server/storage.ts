import { 
  siteContent, blogPosts, mediaFiles, members, boxingClasses, bookings,
  type SiteContent, type InsertSiteContent,
  type BlogPost, type InsertBlogPost,
  type MediaFile, type InsertMediaFile,
  type Member, type InsertMember,
  type BoxingClass, type InsertBoxingClass,
  type Booking, type InsertBooking
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, sql, desc } from "drizzle-orm";

export interface IStorage {
  getContent(key: string): Promise<SiteContent | undefined>;
  upsertContent(key: string, content: any): Promise<SiteContent>;
  
  getAllBlogPosts(): Promise<BlogPost[]>;
  getBlogPost(id: string): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(data: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: string): Promise<boolean>;
  
  getAllMedia(): Promise<MediaFile[]>;
  getMediaFile(id: string): Promise<MediaFile | undefined>;
  createMediaFile(data: InsertMediaFile): Promise<MediaFile>;
  deleteMediaFile(id: string): Promise<boolean>;

  // Member methods
  getMemberByEmail(email: string): Promise<Member | undefined>;
  getMemberById(id: string): Promise<Member | undefined>;
  getMemberByVerificationToken(token: string): Promise<Member | undefined>;
  createMember(data: InsertMember): Promise<Member>;
  updateMember(id: string, data: Partial<Member>): Promise<Member | undefined>;
  getAllMembers(): Promise<Member[]>;

  // Boxing class methods
  getAllClasses(): Promise<BoxingClass[]>;
  getUpcomingClasses(): Promise<BoxingClass[]>;
  getClass(id: string): Promise<BoxingClass | undefined>;
  createClass(data: InsertBoxingClass): Promise<BoxingClass>;
  updateClass(id: string, data: Partial<InsertBoxingClass>): Promise<BoxingClass | undefined>;
  deleteClass(id: string): Promise<boolean>;
  incrementBookedCount(id: string): Promise<void>;
  decrementBookedCount(id: string): Promise<void>;

  // Booking methods
  createBooking(data: InsertBooking): Promise<Booking>;
  getBookingsByMember(memberId: string): Promise<Booking[]>;
  getBookingsByClass(classId: string): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking | undefined>;
  cancelBooking(id: string): Promise<boolean>;
  getAllBookings(): Promise<Booking[]>;
}

export class DatabaseStorage implements IStorage {
  async getContent(key: string): Promise<SiteContent | undefined> {
    const [content] = await db.select().from(siteContent).where(eq(siteContent.key, key));
    return content || undefined;
  }

  async upsertContent(key: string, content: any): Promise<SiteContent> {
    const existing = await this.getContent(key);
    if (existing) {
      const [updated] = await db
        .update(siteContent)
        .set({ content, updatedAt: new Date() })
        .where(eq(siteContent.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(siteContent)
        .values({ key, content })
        .returning();
      return created;
    }
  }

  async getAllBlogPosts(): Promise<BlogPost[]> {
    return db.select().from(blogPosts).orderBy(blogPosts.createdAt);
  }

  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post || undefined;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post || undefined;
  }

  async createBlogPost(data: InsertBlogPost): Promise<BlogPost> {
    const [post] = await db.insert(blogPosts).values(data).returning();
    return post;
  }

  async updateBlogPost(id: string, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const [post] = await db
      .update(blogPosts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return post || undefined;
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    const result = await db.delete(blogPosts).where(eq(blogPosts.id, id)).returning();
    return result.length > 0;
  }

  async getAllMedia(): Promise<MediaFile[]> {
    return db.select().from(mediaFiles).orderBy(mediaFiles.uploadedAt);
  }

  async getMediaFile(id: string): Promise<MediaFile | undefined> {
    const [file] = await db.select().from(mediaFiles).where(eq(mediaFiles.id, id));
    return file || undefined;
  }

  async createMediaFile(data: InsertMediaFile): Promise<MediaFile> {
    const [file] = await db.insert(mediaFiles).values(data).returning();
    return file;
  }

  async deleteMediaFile(id: string): Promise<boolean> {
    const result = await db.delete(mediaFiles).where(eq(mediaFiles.id, id)).returning();
    return result.length > 0;
  }

  // Member methods
  async getMemberByEmail(email: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.email, email.toLowerCase()));
    return member || undefined;
  }

  async getMemberById(id: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member || undefined;
  }

  async getMemberByVerificationToken(token: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.emailVerificationToken, token));
    return member || undefined;
  }

  async createMember(data: InsertMember): Promise<Member> {
    const [member] = await db.insert(members).values({
      ...data,
      email: data.email.toLowerCase(),
    }).returning();
    return member;
  }

  async updateMember(id: string, data: Partial<Member>): Promise<Member | undefined> {
    const [member] = await db.update(members).set(data).where(eq(members.id, id)).returning();
    return member || undefined;
  }

  async getAllMembers(): Promise<Member[]> {
    return db.select().from(members).orderBy(desc(members.createdAt));
  }

  // Boxing class methods
  async getAllClasses(): Promise<BoxingClass[]> {
    return db.select().from(boxingClasses).orderBy(boxingClasses.date, boxingClasses.time);
  }

  async getUpcomingClasses(): Promise<BoxingClass[]> {
    const today = new Date().toISOString().split('T')[0];
    return db.select().from(boxingClasses)
      .where(and(gte(boxingClasses.date, today), eq(boxingClasses.isActive, true)))
      .orderBy(boxingClasses.date, boxingClasses.time);
  }

  async getClass(id: string): Promise<BoxingClass | undefined> {
    const [boxingClass] = await db.select().from(boxingClasses).where(eq(boxingClasses.id, id));
    return boxingClass || undefined;
  }

  async createClass(data: InsertBoxingClass): Promise<BoxingClass> {
    const [boxingClass] = await db.insert(boxingClasses).values(data).returning();
    return boxingClass;
  }

  async updateClass(id: string, data: Partial<InsertBoxingClass>): Promise<BoxingClass | undefined> {
    const [boxingClass] = await db.update(boxingClasses).set(data).where(eq(boxingClasses.id, id)).returning();
    return boxingClass || undefined;
  }

  async deleteClass(id: string): Promise<boolean> {
    const result = await db.delete(boxingClasses).where(eq(boxingClasses.id, id)).returning();
    return result.length > 0;
  }

  async incrementBookedCount(id: string): Promise<void> {
    await db.update(boxingClasses)
      .set({ bookedCount: sql`${boxingClasses.bookedCount} + 1` })
      .where(eq(boxingClasses.id, id));
  }

  async decrementBookedCount(id: string): Promise<void> {
    await db.update(boxingClasses)
      .set({ bookedCount: sql`GREATEST(${boxingClasses.bookedCount} - 1, 0)` })
      .where(eq(boxingClasses.id, id));
  }

  // Booking methods
  async createBooking(data: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(data).returning();
    return booking;
  }

  async getBookingsByMember(memberId: string): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.memberId, memberId)).orderBy(desc(bookings.bookedAt));
  }

  async getBookingsByClass(classId: string): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.classId, classId));
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [booking] = await db.update(bookings).set(data).where(eq(bookings.id, id)).returning();
    return booking || undefined;
  }

  async cancelBooking(id: string): Promise<boolean> {
    const result = await db.update(bookings)
      .set({ status: 'cancelled' })
      .where(eq(bookings.id, id))
      .returning();
    return result.length > 0;
  }

  async getAllBookings(): Promise<Booking[]> {
    return db.select().from(bookings).orderBy(desc(bookings.bookedAt));
  }
}

export const storage = new DatabaseStorage();
