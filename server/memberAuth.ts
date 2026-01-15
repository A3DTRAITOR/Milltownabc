import { Request, Response, NextFunction, Express } from "express";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { z } from "zod";

const SALT_ROUNDS = 12;

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
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
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0].message });
      }

      const { name, email, phone, password, experienceLevel } = result.data;

      // Check if email already exists
      const existingMember = await storage.getMemberByEmail(email);
      if (existingMember) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Create member
      const member = await storage.createMember({
        name,
        email,
        phone: phone || null,
        passwordHash,
        experienceLevel,
      });

      // Set session
      req.session.memberId = member.id;

      res.status(201).json({
        id: member.id,
        name: member.name,
        email: member.email,
        experienceLevel: member.experienceLevel,
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
      const member = await storage.updateMember(req.session.memberId!, {
        name,
        phone,
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

  // Book a class (without payment for now - payment integration can be added)
  app.post("/api/classes/:id/book", isMemberAuthenticated, async (req, res) => {
    try {
      const classId = req.params.id;
      const memberId = req.session.memberId!;

      const boxingClass = await storage.getClass(classId);
      if (!boxingClass) {
        return res.status(404).json({ message: "Class not found" });
      }

      if ((boxingClass.bookedCount || 0) >= (boxingClass.capacity || 12)) {
        return res.status(400).json({ message: "Class is fully booked" });
      }

      // Check if already booked
      const existingBookings = await storage.getBookingsByClass(classId);
      const alreadyBooked = existingBookings.find(
        b => b.memberId === memberId && b.status !== 'cancelled'
      );
      if (alreadyBooked) {
        return res.status(400).json({ message: "You've already booked this class" });
      }

      const booking = await storage.createBooking({
        memberId,
        classId,
        status: "confirmed", // Would be 'pending' until Stripe payment completes
      });

      await storage.incrementBookedCount(classId);

      res.status(201).json(booking);
    } catch (error) {
      console.error("Book class error:", error);
      res.status(500).json({ message: "Failed to book class" });
    }
  });

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

      await storage.cancelBooking(req.params.id);
      await storage.decrementBookedCount(booking.classId);

      res.json({ message: "Booking cancelled" });
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
        experienceLevel: m.experienceLevel,
        isAdmin: m.isAdmin,
        createdAt: m.createdAt,
      })));
    } catch (error) {
      console.error("Get members error:", error);
      res.status(500).json({ message: "Failed to get members" });
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
        member: memberMap.get(b.memberId),
      }));
      
      res.json(enrichedBookings);
    } catch (error) {
      console.error("Get all bookings error:", error);
      res.status(500).json({ message: "Failed to get bookings" });
    }
  });
}
