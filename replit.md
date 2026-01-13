# Coral/Peach Wellness CMS

## Overview

This is a full-stack content management system (CMS) built for wellness and fitness businesses. It features a public-facing website with pages for Home, About, Services, Blog, and Contact, along with an admin dashboard for managing site content, blog posts, and media files. The application uses a coral/peach color theme designed for warmth and approachability.

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
- `users` and `sessions` - Authentication (Replit Auth)

### Authentication
- **Provider**: Replit OpenID Connect (OIDC) authentication
- **Implementation**: Passport.js with openid-client strategy
- **Session Storage**: PostgreSQL-backed sessions
- **Protected Routes**: Admin routes require authentication via `isAuthenticated` middleware

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

### Authentication Services
- Replit OIDC provider (`ISSUER_URL` defaults to `https://replit.com/oidc`)
- Requires `REPL_ID` and `SESSION_SECRET` environment variables

### Third-Party Libraries
- **UI**: Radix UI primitives, Lucide icons, class-variance-authority
- **Forms**: React Hook Form with Zod validation
- **Dates**: date-fns for date formatting
- **Images**: Sharp for server-side image processing

### File Storage
- Local filesystem storage in `./uploads/` directory
- Images served via static file middleware