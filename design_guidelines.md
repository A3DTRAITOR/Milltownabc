# Design Guidelines: Yoga Instructor Theme

## Design Approach

**Serene Wellness Aesthetic:**
- Warm, earthy terracotta and clay tones that evoke grounding and calm
- Sage green accents representing nature, growth, and balance
- Soft, creamy backgrounds for a peaceful atmosphere
- Clean, minimalist design that reflects yoga's emphasis on simplicity
- Emphasis on tranquility, mindfulness, and natural warmth

## Color Palette

### Primary Colors
- **Terracotta:** `hsl(25 55% 45%)` - Warm, grounding primary color for buttons and CTAs (WCAG AA compliant)
- **Sage Green:** `hsl(150 25% 40%)` - Natural accent color representing growth and balance
- **Clay:** `hsl(30 35% 65%)` - Soft supporting color for highlights

### Neutral Colors
- **Warm Cream:** `hsl(30 30% 98%)` - Soft, inviting background
- **Earthy Brown:** `hsl(25 25% 18%)` - Primary text color, grounded and readable
- **Sand:** `hsl(30 20% 94%)` - Muted background for sections
- **Warm Gray:** `hsl(25 15% 45%)` - Secondary text color

### Supporting Colors
- **Balance Green:** `hsl(150 25% 40%)` - Success states and accents
- **Calm Blue:** `hsl(180 20% 45%)` - Complementary accent
- **Alert:** `hsl(0 60% 50%)` - Warnings and errors

## Typography

**Public Pages:**
- Headings: Inter or similar clean sans-serif - h1: text-5xl, h2: text-4xl, h3: text-2xl
- Body: Inter Regular - text-base (16px) with text-lg for intros
- Line height: leading-relaxed for readability and breathing room
- Aesthetic: Clean, open, and calming

**Admin Dashboard:**
- System font stack for performance
- Headings: font-semibold, Body: font-normal
- Tighter spacing for efficiency

## Layout System

**Spacing Primitives:** Generous whitespace using Tailwind units of 6, 8, 12, 16, 20, 24

**Public Page Structure:**
- Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Section padding: py-16 lg:py-24 (generous breathing room)
- Content width: max-w-prose for text-heavy sections

**Admin Layout:**
- Sidebar: Warm, dark earth-toned background
- Content area: Flexible with max-w-6xl
- Card spacing: gap-6 for grids, p-6 for card interiors

## Component Library

### Public Pages

**Hero Section (Homepage):**
- Full-width background with yoga/wellness imagery
- Warm terracotta gradient overlay for brand consistency
- Height: min-h-[600px] lg:min-h-[700px]
- Calming, centered content with clear CTA

**Navigation:**
- Clean header with warm cream background
- Terracotta accents on active/hover states
- Sticky header with subtle shadow
- Height: h-16 lg:h-20

**Cards:**
- Warm cream background with soft borders
- Subtle shadows for gentle depth
- Rounded corners (rounded-xl)
- Generous padding for breathing room

**Buttons:**
- Primary: Terracotta with white text
- Secondary: Sand/clay background
- Accent: Sage green for special actions
- Soft, inviting hover states

**Footer:**
- Warm, grounded design
- Contact info, class schedules, social links
- Newsletter signup for yoga tips

### Admin Dashboard

**Sidebar Navigation:**
- Deep earthy brown background
- Terracotta accents for active states
- Clean, organized menu structure

## Images

**Hero Image:**
- Serene yoga poses, studio environments, or nature scenes
- Calming, peaceful imagery
- Apply warm gradient overlay for brand consistency

**About Page:**
- Instructor photos in natural settings
- Warm, approachable imagery

**Services/Classes:**
- Clean icons with terracotta or sage accents
- Class type illustrations

## Responsive Behavior

**Breakpoints:** sm (640px), md (768px), lg (1024px), xl (1280px)

**Mobile-First:**
- Stack layouts to single column on mobile
- Touch-friendly buttons and navigation
- Reduced padding while maintaining breathing room

## Forms & Inputs

**Contact/Booking Forms:**
- Warm border colors with terracotta focus ring
- Generous spacing between fields
- Clear, calming success messages

## Accessibility

- WCAG AA compliant color contrast
- Focus states with terracotta ring
- Clear, readable typography
- Keyboard navigation support

This design creates a calm, grounding yoga brand aesthetic with warm earthy tones, balanced by natural sage green accents, perfect for attracting clients seeking mindfulness and wellness.