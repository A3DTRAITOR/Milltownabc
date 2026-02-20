# Mill Town ABC - Website Handover Document

## Recommended Hosting Provider

### Railway.app - £4/month (~$5 USD)
**Why Railway:**
- Cheapest option for Node.js + PostgreSQL together
- One-click PostgreSQL database included
- Auto-deploys from GitHub
- Simple environment variable management
- Pay only for what you use

**Sign up:** https://railway.app

---

## Step-by-Step Transfer Guide

### Step 1: Download Your Code

1. Download or export the project files as a zip
2. Extract the zip file to your computer

### Step 2: Push Code to GitHub

1. Create a new repository on GitHub (e.g., `mill-town-abc`)
2. Upload your extracted files to the repository
3. Make sure these files are included:
   - `package.json`
   - `server/` folder
   - `client/` folder
   - `shared/` folder
   - `drizzle.config.ts`
   - `tsconfig.json`
   - `vite.config.ts`

### Step 3: Set Up Railway

1. Go to https://railway.app and sign up
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your Mill Town ABC repository
4. Railway will auto-detect it's a Node.js app

### Step 4: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will automatically create and connect the database
4. Click on the PostgreSQL service → **"Variables"** tab
5. Copy the `DATABASE_URL` value

### Step 5: Configure Environment Variables

In Railway, go to your web service → **"Variables"** tab and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | (Auto-set by Railway if you link the DB) |
| `SESSION_SECRET` | Generate a random 32-character string |
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `SQUARE_ACCESS_TOKEN` | Your LIVE Square access token |
| `SQUARE_APPLICATION_ID` | Your LIVE Square application ID |
| `SQUARE_LOCATION_ID` | Your Square location ID |
| `RESEND_API_KEY` | Your Resend API key |
| `RESEND_FROM_EMAIL` | `Mill Town ABC <noreply@milltownabc.co.uk>` |

**Optional (for spam protection):**
| Variable | Value |
|----------|-------|
| `HCAPTCHA_SECRET_KEY` | From hcaptcha.com |
| `VITE_HCAPTCHA_SITE_KEY` | From hcaptcha.com |

### Step 6: Configure Build Settings

In Railway, set these build commands:

- **Build Command:** `npm run build`
- **Start Command:** `npm start`

### Step 7: Deploy

1. Railway will automatically build and deploy
2. Once deployed, click **"Settings"** → **"Networking"**
3. Click **"Generate Domain"** to get a temporary URL
4. Test the site works

### Step 8: Connect Custom Domain (milltownabc.co.uk)

1. In Railway, go to **Settings** → **Networking** → **Custom Domain**
2. Enter: `milltownabc.co.uk`
3. Railway will give you DNS records to add
4. Log into your domain registrar and add:
   - **CNAME record:** `@` or `www` pointing to Railway's domain
   - Or **A record** if Railway provides an IP

---

## Getting Your API Keys

### Square (Payment Processing)
1. Go to https://squareup.com/gb/en → Developer Dashboard
2. Create an application or use existing
3. Switch from **Sandbox** to **Production**
4. Copy:
   - Access Token
   - Application ID
   - Location ID

### Resend (Email)
1. Go to https://resend.com
2. Create an account and verify your domain (milltownabc.co.uk)
3. Go to **API Keys** → Create new key
4. Copy the API key

### hCaptcha (Spam Protection - Optional)
1. Go to https://hcaptcha.com
2. Create an account
3. Add your site
4. Copy:
   - Site Key (for VITE_HCAPTCHA_SITE_KEY)
   - Secret Key (for HCAPTCHA_SECRET_KEY)

---

## Current Configuration Values

### Square (SANDBOX - Replace with LIVE keys!)
- Application ID: `sandbox-sq0idb-...` (SANDBOX)
- Location ID: Currently set
- Access Token: Currently set

**ACTION REQUIRED:** Replace with LIVE Square credentials before accepting real payments!

### Resend Email
- From Email: `Mill Town ABC <noreply@milltownabc.co.uk>`
- API Key: Set via RESEND_API_KEY environment variable

### Database
- Type: PostgreSQL
- Current: Will need new DB on Railway

---

## Admin Access

### Creating an Admin Account
1. Register a normal member account on the website
2. Access the database directly (Railway provides a DB console)
3. Run this SQL to make yourself admin:

```sql
UPDATE members SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Admin Panel URL
`https://milltownabc.co.uk/admin`

### Admin Features
- **Dashboard:** Overview of bookings and revenue
- **Members:** View, edit, delete members
- **Bookings:** View all bookings, confirm cash payments, cancel bookings
- **Classes:** Manage class schedule and recurring sessions
- **Content:** Edit all page content (Home, About, Services, etc.)
- **Blog:** Create and manage blog posts
- **Settings:** Site-wide settings
- **Financials:** Revenue reports with CSV export

---

## Website Features Summary

### Public Pages
- Home (with coach photo and stats)
- About
- Training Programs
- Class Schedule (calendar booking)
- Safety Policy
- Blog
- Contact

### Member Features
- Registration with email verification
- Login/logout with 30-min session timeout
- Dashboard with booking history
- Book classes (max 3 future bookings)
- First session FREE, then £5 per session
- Pay by card (Square) or cash at reception
- Cancel bookings (free session restored if applicable)

### Anti-Spam Protection
- Rate limiting (2 bookings per IP/day, 1 registration per IP/day)
- Email verification required before booking
- Auto-cancel unconfirmed bookings after 24 hours
- hCaptcha on signup/booking forms (if configured)

---

## Maintenance Tasks

### Regular Tasks
- Class sessions auto-generate 2 weeks ahead
- Unconfirmed bookings auto-cancel after 24 hours
- Check admin panel for pending cash payments

### Database Backups
Railway provides automatic database backups on paid plans.

---

## Troubleshooting

### App won't start
- Check all environment variables are set
- Check DATABASE_URL is correct
- Check Railway logs for errors

### Emails not sending
- Verify RESEND_API_KEY is set
- Verify domain is verified in Resend dashboard
- Check RESEND_FROM_EMAIL matches verified domain

### Payments not working
- Ensure using LIVE Square credentials (not sandbox)
- Check Square dashboard for errors
- Verify SQUARE_LOCATION_ID is correct

---

## Support Contacts

### Square Support
https://squareup.com/help/gb/en

### Resend Support
https://resend.com/docs

### Railway Support
https://railway.app/help

---

## Quick Reference

| Service | URL |
|---------|-----|
| Website | https://milltownabc.co.uk |
| Admin Panel | https://milltownabc.co.uk/admin |
| Railway Dashboard | https://railway.app/dashboard |
| Square Dashboard | https://squareup.com/dashboard |
| Resend Dashboard | https://resend.com |
| Domain Registrar | (wherever milltownabc.co.uk is registered) |

---

**Document Created:** February 2026
**Website Version:** 1.0 - Production Ready
