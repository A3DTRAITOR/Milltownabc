# Mill Town ABC

## Overview

This is a full-stack boxing club website for Mill Town ABC, based at Whitfield Community Centre in Glossop. Features member authentication, calendar-based class booking system, and comprehensive admin CMS. 

Key features:
- Public pages: Home, About, Training Programs, Class Schedule, Safety Policy, Blog, Contact
- Member accounts: register/login with session management
- Class booking: £5 per session, first session FREE
- Member dashboard for viewing and managing bookings
- Admin panel with role-based access control for managing content, classes, members, and financials
- UK-compliant financial reporting with CSV export for accountants

Design uses a bold boxing aesthetic with colors: black (#000000), white (#FFFFFF), light gray (#F5F5F5), red (#C8102E), and gray (#4A5568).

### Club Information
- **Location**: Whitfield Community Centre, Ebenezer Street, Glossop, SK13 8JY
- **Contact**: Alex: 07565 208193, Mark: 07713 659360
- **Email**: Milltownabc@gmail.com
- **Social**: Facebook & Instagram (@mill_town_abc)
- **Head Coach**: Alex Clegg - 70+ amateur bouts, 8x NW Champion, ABA National Champion
- **Classes**: Monday (Beginners 17:30-18:30, Seniors 18:45-20:00), Wednesday 17:30-18:30, Saturday 10:00-11:00
- **Pricing**: £5 per session, first session FREE, no joining fees
- **Membership types**: Beginner Boxers, General Training, Carded Boxers
- **Facilities**: 6 boxing bags, 16ft boxing ring, general fitness equipment

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Build Tool**: Vite with hot module replacement

The frontend is organized into:
- `client/src/pages/` - Route-level page components (public pages and admin dashboard)
- `client/src/components/` - Reusable UI components including layouts and shadcn/ui components
- `client/src/hooks/` - Custom React hooks for auth, toast notifications, and mobile detection
- `client/src/lib/` - Utility functions and API client configuration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful JSON API endpoints under `/api/`
- **File Uploads**: Multer for handling multipart form data, Sharp for image processing
- **Session Management**: express-session with PostgreSQL store (connect-pg-simple)

The server handles:
- Content management API (CRUD for pages, blog posts, media)
- Contact form submission with rate limiting
- Image upload with automatic resizing (max 1200px width)
- Static file serving for production builds

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema synchronization

Database tables:
- `site_content` - Key-value store for page content (JSON)
- `blog_posts` - Blog articles with SEO metadata
- `media_files` - Uploaded image metadata
- `members` - Member accounts with authentication
- `classes` - Class schedule and availability
- `bookings` - Member class bookings with payment status
- `sessions` - Session management

### Authentication
- Custom member authentication with email/password
- bcrypt password hashing
- Session-based authentication with PostgreSQL store
- Protected routes for member dashboard and admin panel

### Build System
- **Development**: Vite dev server with HMR proxied through Express
- **Production**: 
  - Frontend: Vite builds to `dist/public/`
  - Backend: esbuild bundles server to `dist/index.cjs`
  - Selective dependency bundling to optimize cold start times

## External Dependencies

### Database
- PostgreSQL database (provisioned via Replit)
- Connection via `DATABASE_URL` environment variable

### Third-Party Libraries
- **UI**: Radix UI primitives, Lucide icons, class-variance-authority
- **Forms**: React Hook Form with Zod validation
- **Dates**: date-fns for date formatting
- **Images**: Sharp for server-side image processing

### File Storage
- Local filesystem storage in `./uploads/` directory
- Images served via static file middleware

### Anti-Spam Protection
- **hCaptcha**: Integrated on signup and booking forms (requires HCAPTCHA_SECRET_KEY and VITE_HCAPTCHA_SITE_KEY)
- **Rate Limiting**: 
  - Max 2 bookings per IP per day
  - Max 1 account registration per IP per day
  - Max 3 future bookings per user
- **Email Verification**: Required before booking (when SMTP is configured)
- **Auto-Cancel**: Unconfirmed bookings auto-cancelled after 24 hours
- **Suspicious Activity Logging**: Captures failed CAPTCHAs, rate limit violations
- **Admin Security Log**: Available at `/api/admin/security-log` for admins

### Email Notifications
- **Nodemailer**: SMTP-based email confirmations for bookings and verification
- **Required Environment Variables**: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS

### Payment Processing (Square)
- **Square SDK**: Replaced Stripe with Square for UK-based payments
- **Sandbox Mode**: Currently configured for testing (sandbox-sq0... credentials)
- **Required Environment Variables**:
  - SQUARE_APPLICATION_ID: Your Square application ID
  - SQUARE_ACCESS_TOKEN: Your Square access token
  - SQUARE_LOCATION_ID: Your Square location ID
- **Get Sandbox Keys**: Visit squareup.com/gb/en → Developer Dashboard → Sandbox environment
- **TODO**: Replace sandbox keys with live keys for production

### Admin Dashboard Features
- Pending payments view at `/api/admin/pending-bookings`
- Manual booking confirmation at `/api/admin/bookings/:id/confirm`
- Bulk cancel suspicious bookings at `/api/admin/bookings/bulk-cancel`
