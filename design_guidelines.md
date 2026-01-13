# Design Guidelines: Coral/Peach Wellness Theme

## Design Approach

**Wellness-Inspired Theme:**
- Warm coral and peach color palette inspired by fitness and wellness brands
- Clean white backgrounds with soft, inviting accents
- Modern, approachable typography
- Emphasis on warmth, energy, and positive vibes

## Color Palette

### Primary Colors
- **Primary Coral:** `hsl(17 75% 42%)` - Main brand color for CTAs, buttons, and accents (WCAG AA compliant with white text)
- **Secondary Peach:** `hsl(24 92% 74%)` - Lighter accent for hover states and highlights
- **Terracotta:** `hsl(12 78% 55%)` - Deep accent for emphasis

### Neutral Colors
- **Background:** Pure white `hsl(0 0% 100%)`
- **Charcoal:** `hsl(15 22% 18%)` - Primary text and dark elements
- **Warm Sand:** `hsl(32 46% 96%)` - Muted backgrounds
- **Clay:** `hsl(20 40% 70%)` - Dividers and subtle borders

### Supporting Colors
- **Success Green:** `hsl(150 35% 36%)`
- **Alert Red:** `hsl(0 70% 55%)`

## Typography

**Public Pages:**
- Headings: Inter Bold - h1: text-5xl, h2: text-4xl, h3: text-2xl
- Body: Inter Regular - text-base (16px) with text-lg for intros
- Line height: leading-relaxed for readability
- Letter-spacing: Normal tracking for headlines, relaxed for body

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
- Sidebar: Dark charcoal background matching the wellness theme
- Content area: Flexible with max-w-6xl
- Card spacing: gap-6 for grids, p-6 for card interiors

## Component Library

### Public Pages

**Hero Section (Homepage):**
- Full-width background image with coral gradient overlay
- Gradient: `linear-gradient(120deg, hsl(17 85% 60% / 0.78), hsl(24 92% 74% / 0.68))`
- Height: min-h-[600px] lg:min-h-[700px]
- Light text over the warm overlay
- CTA buttons with white/coral styling

**Navigation:**
- Clean white header with coral accents
- Sticky header with subtle shadow
- Mobile: Hamburger menu, full-screen overlay
- Height: h-16 lg:h-20

**Cards:**
- White background, rounded-xl border radius
- Subtle warm shadow: `0 10px 30px -12px hsl(15 40% 25% / 0.32)`
- Padding: p-6 lg:p-8
- Optional coral top border accent for emphasis

**Buttons:**
- Primary: Coral background with white text
- Secondary: Peach background with dark text
- Outline: Charcoal border with coral hover
- All buttons have subtle shadows for depth

**Footer:**
- Warm sand or white background
- 4-column grid on desktop (About, Services, Quick Links, Contact)
- Stack single column on mobile
- Newsletter signup, social icons, copyright

### Admin Dashboard

**Sidebar Navigation:**
- Dark charcoal background matching brand
- Vertical list with icons (Lucide) + labels
- Active state: Coral highlight
- Sections: Dashboard, Pages, Blog, Media, Settings

## Images

**Hero Image (Homepage):**
- High-quality wellness/fitness imagery
- Dimensions: 1920x1080 minimum
- Apply coral/peach gradient overlay for brand consistency
- Light text rendered over the overlay

**About Page:**
- Team or wellness-focused photos: 600x400
- Warm, inviting imagery

**Services/Offerings Page:**
- Icon-based with coral accents
- Clean, minimal design

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
- Input styling: Warm border colors, coral focus ring
- Submit button: Full width on mobile, auto on desktop

**Admin Forms:**
- Clean styling with coral accent on focus
- Validation: Inline error messages
- Image upload: Prominent drop zone

## Accessibility

- ARIA labels on all interactive elements
- Focus states: Coral focus ring for brand consistency
- Color contrast: WCAG AA minimum (4.5:1 for body text)
- Keyboard navigation: Tab through all interactive elements
- Alt text required for all uploaded images

This design creates a warm, inviting wellness brand aesthetic with coral and peach tones, balanced with clean white spaces and charcoal text for readability.