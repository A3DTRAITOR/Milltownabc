# Design Guidelines: Milltown Boxing Club

## Design Approach

**Bold Boxing Aesthetic:**
- High-contrast black and white with striking red accents
- Strong, powerful typography that conveys strength and determination
- Clean, athletic design that reflects boxing's intensity
- Dark backgrounds with light text for impact
- Sharp edges and bold visual elements

## Color Palette

### Primary Colors
- **Boxing Red:** `hsl(354 75% 44%)` - Bold, powerful primary color (#C8102E equivalent)
- **Black:** `hsl(0 0% 5%)` - Strong, grounded backgrounds
- **White:** `hsl(0 0% 96%)` - Clean, crisp text and highlights

### Neutral Colors
- **Light Gray:** `hsl(0 0% 96%)` - (#F5F5F5) Clean backgrounds
- **Dark Gray:** `hsl(215 14% 34%)` - (#4A5568) Secondary text
- **Medium Gray:** `hsl(0 0% 50%)` - Borders and dividers

### Supporting Colors
- **Success Green:** `hsl(150 50% 40%)` - Booking confirmations
- **Alert Red:** `hsl(0 60% 50%)` - Warnings and errors

## Typography

**Public Pages:**
- Headings: Bold, uppercase for impact - h1: text-5xl font-black, h2: text-4xl font-bold
- Body: Clean sans-serif - text-base (16px)
- Use uppercase and letter-spacing for headings when emphasizing power
- Strong visual hierarchy

**Admin Dashboard:**
- System font stack for performance
- Headings: font-semibold, Body: font-normal

## Layout System

**Spacing Primitives:** Athletic, tight spacing - Tailwind units of 4, 6, 8, 12, 16, 20

**Public Page Structure:**
- Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Section padding: py-16 lg:py-24
- High-contrast section alternation (dark/light)

## Component Library

### Public Pages

**Hero Section (Homepage):**
- Full-width dark background with boxing imagery
- Bold red accents and powerful CTAs
- Height: min-h-[600px] lg:min-h-[700px]
- Impactful, centered messaging

**Navigation:**
- Dark header with white text
- Red accents on active/hover states
- Sticky header
- Height: h-16 lg:h-20

**Cards:**
- Clean white or dark backgrounds
- Sharp corners or subtle rounding (rounded-md)
- Strong borders or shadows

**Buttons:**
- Primary: Bold red with white text
- Secondary: Dark gray background
- Ghost: Transparent with red text
- Strong hover states

**Footer:**
- Dark background with light text
- Contact info, gym hours, social links
- Membership signup CTA

### Class Schedule

**Session Cards:**
- Clear date/time display
- Capacity indicators
- Price prominently displayed (£15)
- Bold "Book Now" CTAs

## Images

**Hero Image:**
- Boxing action shots, gym environments
- Apply dark overlay for text readability
- High-energy, powerful imagery

**About Page:**
- Trainer/coach photos
- Gym facility shots
- Action photos from classes

## Responsive Behavior

**Breakpoints:** sm (640px), md (768px), lg (1024px), xl (1280px)

**Mobile-First:**
- Stack layouts on mobile
- Touch-friendly buttons (min-h-10)
- Simplified navigation

## Forms & Inputs

**Registration/Booking Forms:**
- Dark borders with red focus ring
- Clear field labels
- Prominent submit buttons
- Success confirmations in green

## Accessibility

- WCAG AA compliant contrast
- Focus states with red ring
- Clear, readable typography
- Keyboard navigation support

This design creates a bold, athletic boxing brand aesthetic with high-contrast black, white, and red colors that convey strength, power, and professionalism.