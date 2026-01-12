# Design Guidelines: Small Business CMS Website

## Design Approach

**Hybrid Strategy:**
- **Public Pages:** Reference-based approach inspired by Squarespace, Wix, and professional small business templates
- **Admin Dashboard:** Material Design system for clean, functional interface
- **Rationale:** Public pages need visual polish to represent businesses professionally; admin needs efficient, learnable interface for content management

## Typography

**Public Pages:**
- Headings: Inter Bold (Google Fonts) - h1: text-5xl, h2: text-4xl, h3: text-2xl
- Body: Inter Regular - text-base (16px) with text-lg for intros
- Line height: leading-relaxed for readability

**Admin Dashboard:**
- System font stack for performance: -apple-system, BlinkMacSystemFont, "Segoe UI"
- Headings: font-semibold, Body: font-normal
- Tighter spacing: leading-normal

## Layout System

**Spacing Primitives:** Tailwind units of 4, 6, 8, 12, 16, 20, 24 (e.g., p-4, gap-8, py-20)

**Public Page Structure:**
- Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Section padding: py-16 lg:py-24
- Content width: max-w-prose for text-heavy sections

**Admin Layout:**
- Sidebar: Fixed 16rem width on desktop, collapsible on mobile
- Content area: Flexible with max-w-6xl
- Card spacing: gap-6 for grids, p-6 for card interiors

## Component Library

### Public Pages

**Hero Section (Homepage):**
- Full-width background image with overlay
- Height: min-h-[600px] lg:min-h-[700px]
- Centered content: max-w-3xl with heading + subheading + CTA
- Dual CTA buttons with blur backdrop (backdrop-blur-md bg-white/90)

**Navigation:**
- Sticky header with logo left, links right
- Mobile: Hamburger menu, full-screen overlay
- Height: h-16 lg:h-20

**Page Sections:**
- About: 2-column split (image + text) on desktop, stack on mobile
- Services: 3-column grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3) with icon, title, description cards
- Blog: Masonry-style grid with featured image, title, excerpt, date
- Contact: 2-column (form left, map/info right)

**Cards:**
- White background, rounded-xl, subtle shadow
- Padding: p-6 lg:p-8
- Hover: subtle lift with transition

**Footer:**
- 4-column grid on desktop (About, Services, Quick Links, Contact)
- Stack single column on mobile
- Newsletter signup, social icons, copyright

### Admin Dashboard

**Sidebar Navigation:**
- Vertical list with icons (Heroicons) + labels
- Active state: bg-gray-100 with border-l-4 accent
- Sections: Dashboard, Pages, Blog, Media, Settings

**Content Editor:**
- Form layout with labeled sections
- Input groups: label above, input below with focus:ring
- Card-based sections with save buttons
- Preview toggle switch

**Blog Management:**
- Table view with thumbnail, title, status, date, actions
- Add New button (top right)
- Inline editing with htmx updates

**Media Upload:**
- Drag-and-drop zone: border-dashed border-2 min-h-[200px]
- Grid gallery below with delete actions
- Image preview cards: aspect-square with overlay controls

## Images

**Hero Image (Homepage):**
- High-quality professional image relevant to business type (office space, service in action, or abstract professional)
- Dimensions: 1920x1080 minimum
- Placement: Full-width background with dark overlay (opacity-50) for text contrast
- Buttons on hero: White text with backdrop-blur-md bg-white/10 border border-white/20

**About Page:**
- Team or workspace photo: 600x400, placed left column on desktop
- Professional headshot optional for founder bio

**Services Page:**
- Icon-based (Heroicons), no photos unless service-specific imagery needed

**Blog:**
- Featured images: 16:9 aspect ratio, 1200x675px
- Thumbnails in listing: 400x225px

## Responsive Behavior

**Breakpoints:** sm (640px), md (768px), lg (1024px), xl (1280px)

**Mobile-First:**
- Stack all multi-column layouts to single column
- Navigation: Full-screen menu overlay
- Admin sidebar: Hidden behind hamburger
- Touch-friendly: min-h-12 for all interactive elements
- Reduced padding: py-12 instead of py-20

## Forms & Inputs

**Public Contact Form:**
- Full-width on mobile, max-w-lg on desktop
- Input styling: border rounded-lg px-4 py-3 focus:ring-2 focus:ring-offset-2
- Submit button: Full width on mobile, auto on desktop

**Admin Forms:**
- Two-column grid for related fields on desktop
- WYSIWYG editor for content (Quill.js recommended)
- Image upload: Prominent drop zone with file picker fallback
- Validation: Inline error messages in red below fields

## SEO & Meta

- Each page: Editable title (max-w-prose input), meta description (textarea with 160 char counter)
- Schema markup: LocalBusiness JSON-LD in footer
- Semantic HTML: proper heading hierarchy, nav, main, footer tags

## Accessibility

- ARIA labels on all interactive elements
- Focus states: focus:ring-2 focus:ring-blue-500
- Color contrast: WCAG AA minimum (4.5:1 for body text)
- Keyboard navigation: Tab through all interactive elements
- Alt text required for all uploaded images in admin

This design balances professional polish for client-facing pages with efficient functionality for content management, ensuring small businesses can maintain an impressive web presence with minimal technical knowledge.