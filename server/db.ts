import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

console.log("[STARTUP] NODE_ENV:", process.env.NODE_ENV);
console.log("[STARTUP] DATABASE_URL set:", !!process.env.DATABASE_URL);
console.log("[STARTUP] PORT:", process.env.PORT);

if (!process.env.DATABASE_URL) {
  const envKeys = Object.keys(process.env).filter(k => !k.startsWith('npm_') && !k.startsWith('_')).sort().join(', ');
  console.error("[FATAL] DATABASE_URL is not set.");
  console.error("[FATAL] Available env var keys:", envKeys);
  console.error("[FATAL] Make sure DATABASE_URL is set in your hosting provider's environment variables.");
  console.error("[FATAL] On Render: use the External Database URL from your PostgreSQL service.");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isProduction = process.env.NODE_ENV === "production";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('[DB] Pool error:', err.message);
});

export const db = drizzle(pool, { schema });

export async function initializeDatabase() {
  console.log("[DB] Testing database connection...");
  try {
    const result = await pool.query('SELECT NOW()');
    console.log("[DB] Connection successful:", result.rows[0].now);
  } catch (err: any) {
    console.error("[DB] Connection FAILED:", err.message);
    throw err;
  }

  const queries = [
    `CREATE TABLE IF NOT EXISTS "sessions" (
      "sid" varchar PRIMARY KEY,
      "sess" jsonb NOT NULL,
      "expire" timestamp NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire")`,
    `CREATE TABLE IF NOT EXISTS "members" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" varchar(255) NOT NULL,
      "email" varchar(255) NOT NULL UNIQUE,
      "phone" varchar(20) UNIQUE,
      "age" integer,
      "emergency_contact_name" varchar(255),
      "emergency_contact_phone" varchar(20),
      "password_hash" varchar(255) NOT NULL,
      "experience_level" varchar(50) DEFAULT 'beginner',
      "is_admin" boolean DEFAULT false,
      "has_used_free_session" boolean DEFAULT false,
      "square_customer_id" varchar(255),
      "email_verified" boolean DEFAULT false,
      "email_verification_token" varchar(255),
      "created_at" timestamp DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS "class_templates" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "day_of_week" integer NOT NULL,
      "time" varchar(10) NOT NULL,
      "title" varchar(255) NOT NULL,
      "class_type" varchar(100) NOT NULL,
      "duration" integer DEFAULT 60,
      "description" text,
      "is_active" boolean DEFAULT true,
      "created_at" timestamp DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS "boxing_classes" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "title" varchar(255) NOT NULL,
      "description" text,
      "class_type" varchar(100) NOT NULL,
      "date" varchar(10) NOT NULL,
      "time" varchar(10) NOT NULL,
      "duration" integer DEFAULT 60,
      "capacity" integer DEFAULT 12,
      "booked_count" integer DEFAULT 0,
      "price" decimal(10,2) DEFAULT 15.00,
      "is_active" boolean DEFAULT true,
      "created_at" timestamp DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS "bookings" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "member_id" varchar REFERENCES "members"("id"),
      "class_id" varchar NOT NULL REFERENCES "boxing_classes"("id"),
      "square_payment_id" varchar(255),
      "payment_method" varchar(20) DEFAULT 'card',
      "status" varchar(50) DEFAULT 'pending',
      "is_free_session" boolean DEFAULT false,
      "price" decimal(10,2) DEFAULT 5.00,
      "booked_at" timestamp DEFAULT now(),
      "member_deleted" boolean DEFAULT false,
      "deleted_member_name" varchar(100)
    )`,
    `CREATE TABLE IF NOT EXISTS "site_content" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "key" varchar(100) NOT NULL UNIQUE,
      "content" jsonb NOT NULL,
      "updated_at" timestamp DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS "blog_posts" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "title" varchar(255) NOT NULL,
      "slug" varchar(255) NOT NULL UNIQUE,
      "excerpt" text,
      "content" text NOT NULL,
      "featured_image" varchar(500),
      "meta_title" varchar(60),
      "meta_description" varchar(160),
      "published" boolean DEFAULT false,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS "media_files" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "filename" varchar(255) NOT NULL,
      "original_name" varchar(255) NOT NULL,
      "mime_type" varchar(100) NOT NULL,
      "size" varchar NOT NULL,
      "url" varchar(500) NOT NULL,
      "width" varchar,
      "height" varchar,
      "uploaded_at" timestamp DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS "users" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "email" varchar UNIQUE,
      "first_name" varchar,
      "last_name" varchar,
      "profile_image_url" varchar,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    )`
  ];

  try {
    console.log("[DB] Initializing database schema...");
    for (const query of queries) {
      await pool.query(query);
    }
    console.log("[DB] Database schema initialized successfully!");
  } catch (err: any) {
    console.error("[DB] Schema init error:", err.message);
  }
}
