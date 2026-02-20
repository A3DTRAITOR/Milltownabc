# Deploying Mill Town ABC to Railway

## Prerequisites
- Railway account (railway.app)
- GitHub repository with this code
- PostgreSQL database (can use Railway's built-in PostgreSQL add-on)
- Square account with live credentials (for payments)
- Resend account with API key (for emails)
- Custom domain (optional, e.g. milltownabc.co.uk)

## Step 1: Create a New Project on Railway

1. Go to railway.app and create a new project
2. Choose "Deploy from GitHub repo" and connect your repository
3. Railway will auto-detect the Dockerfile and build the app

## Step 2: Add a PostgreSQL Database

1. In your Railway project, click "New" > "Database" > "PostgreSQL"
2. Railway will automatically set the `DATABASE_URL` environment variable

## Step 3: Set Environment Variables

In your Railway project settings, add these environment variables:

### Required
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Auto-set by Railway PostgreSQL |
| `SESSION_SECRET` | Random secret for session cookies (min 32 chars) | Generate with: `openssl rand -hex 32` |
| `SQUARE_ACCESS_TOKEN` | Your Square live access token | `EAAAl...` (from Square Developer Dashboard) |
| `SQUARE_APPLICATION_ID` | Your Square live application ID | `sq0idp-...` |
| `SQUARE_LOCATION_ID` | Your Square live location ID | `L...` |
| `RESEND_API_KEY` | Your Resend API key for sending emails | `re_...` |

### Optional
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `production` |
| `RESEND_FROM_EMAIL` | From address for emails | `Mill Town ABC <noreply@milltownabc.co.uk>` |
| `HCAPTCHA_SECRET_KEY` | hCaptcha secret (anti-spam) | Not set (captcha disabled) |
| `VITE_HCAPTCHA_SITE_KEY` | hCaptcha site key (frontend) | Not set |

## Step 4: Set Up the Database

After deploying, you need to push the database schema. You can do this by:

1. Connect to your Railway project via CLI: `railway link`
2. Run: `railway run npx drizzle-kit push`

Or use Railway's shell feature to run the migration command directly.

## Step 5: Create an Admin Account

1. Register a regular account through the website
2. Verify the email via the verification link
3. Connect to the database and set the admin flag:

```sql
UPDATE members SET is_admin = true WHERE email = 'your-admin@email.com';
```

## Step 6: Custom Domain (Optional)

1. In Railway project settings, go to "Domains"
2. Add your custom domain (e.g., milltownabc.co.uk)
3. Follow Railway's DNS configuration instructions
4. Railway handles SSL/TLS certificates automatically

## Step 7: Square Live Credentials

**Important:** The app is currently configured with sandbox Square credentials.

To accept real payments:
1. Go to squareup.com > Developer Dashboard
2. Switch from Sandbox to Production
3. Create a new application or use your existing one
4. Copy the Production Access Token, Application ID, and Location ID
5. Update the Railway environment variables with the live credentials

## Build & Start Commands

These are already configured in the Dockerfile:
- **Build:** `npm ci && npm run build`
- **Start:** `npm start` (runs `NODE_ENV=production node dist/index.cjs`)

## Health Check

The Railway config includes a health check on `/api/classes` to verify the app is running.

## File Uploads

Uploaded images are stored in the `./uploads/` directory inside the container.
Note: Railway containers are ephemeral, so uploaded files may be lost on redeployment.
For persistent file storage, consider using an external service like AWS S3 or Cloudflare R2.

## Troubleshooting

### App crashes on startup
- Check that `DATABASE_URL` is set and the database is accessible
- Check that `SESSION_SECRET` is set
- View logs in Railway dashboard

### Payments not working
- Ensure Square credentials are for the Production environment (not Sandbox)
- Check that all three Square variables are set: `SQUARE_ACCESS_TOKEN`, `SQUARE_APPLICATION_ID`, `SQUARE_LOCATION_ID`

### Emails not sending
- Check that `RESEND_API_KEY` is set
- Verify your sending domain is configured in Resend dashboard
- For custom from address, set `RESEND_FROM_EMAIL`

### Sessions not persisting
- Ensure `SESSION_SECRET` is set to a strong random value
- The database session table is created automatically on first run

## Monthly Cost Estimate

Railway Hobby plan: ~£4-5/month
- Includes 500 hours of compute
- PostgreSQL database included
- Custom domains supported
- SSL/TLS included
