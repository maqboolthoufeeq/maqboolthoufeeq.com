# Personal Portfolio & Blog

A clean, self-hostable personal site with a built-in CMS. Fork it, swap in your name and content, deploy in minutes.

Built with Next.js 16, Tailwind CSS v4, Prisma + PostgreSQL, NextAuth v5, and Tiptap.

---

## Make it yours (before deploying)

| What | Where |
|---|---|
| Your name, title, intro | `components/sections/Hero.tsx` |
| About text and skills | `components/sections/About.tsx` |
| GitHub, LinkedIn, email links | `components/sections/Contact.tsx` |
| Headshot photo | Replace `public/headshot.jpg` (square, 400×400 px min) |
| Accent colour | `app/globals.css` → `--accent` in `:root` and `.dark` |
| Site title / meta | `app/layout.tsx` → `metadata` object |

---

## Deploy to Vercel (recommended)

### 1. Fork & push to GitHub
Fork this repo (or clone and push to your own GitHub account).

### 2. Create a free database
Go to [neon.tech](https://neon.tech), create a free Postgres database, and copy the connection string.

### 3. Import on Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repo.
2. Vercel auto-detects Next.js — just click **Deploy**.

### 4. Add environment variables
In your Vercel project → **Settings** → **Environment Variables**, add these:

| Variable | How to get it |
|---|---|
| `DATABASE_URL` | Your Neon connection string |
| `AUTH_SECRET` | Run `openssl rand -base64 32` in your terminal |
| `ADMIN_EMAIL` | Your login email for the admin panel |
| `ADMIN_PASSWORD_HASH` | See below |
| `BLOB_READ_WRITE_TOKEN` | Auto-added by Vercel when you create a Blob store — see below |
| `SMTP_HOST` | Your email provider's SMTP server, e.g. `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port, e.g. `587` (STARTTLS) or `465` (SSL) |
| `SMTP_USER` | SMTP username (usually your full email address) |
| `SMTP_PASS` | SMTP password (for Gmail, use an App Password — see below) |
| `SMTP_FROM` | The "from" address shown on outgoing email |

**Generate your admin password hash:**
```bash
node -e "require('bcryptjs').hash('YourPassword123!', 12).then(console.log)"
```
Copy the `$2b$12$...` output into `ADMIN_PASSWORD_HASH`.

**Get your `BLOB_READ_WRITE_TOKEN`:** You don't create this one by hand — Vercel generates it for you when you set up a Blob store:

1. In your Vercel project, go to **Storage** → **Create Database** → **Blob**.
2. Give the store a name and create it, making sure it's **connected to this project**.
3. Vercel automatically adds a `BLOB_READ_WRITE_TOKEN` environment variable to the connected project — you don't have to copy/paste it.
4. **Redeploy** the project (or trigger your first deployment) so the new variable is picked up at runtime.

> If you import and deploy the repo *before* creating the Blob store, the token simply won't exist yet — create the store, then redeploy and it'll be wired up automatically. You can always view/copy the generated value later under **Settings → Environment Variables**.

**Gmail SMTP (easiest):** Use an [App Password](https://myaccount.google.com/apppasswords) as `SMTP_PASS` (requires 2-Step Verification on your Google account).

**Or, if you already have a Mailgun domain**, skip SMTP and set these instead:

| Variable | Value |
|---|---|
| `MAILGUN_API_KEY` | Your Mailgun API key |
| `MAILGUN_DOMAIN` | e.g. `mg.yourdomain.com` |
| `MAILGUN_FROM` | e.g. `noreply@mg.yourdomain.com` |
| `MAILGUN_REGION` | `eu` only if your account is on the EU region |

The system tries SMTP first and falls back to Mailgun automatically.

### 5. Redeploy
After adding env vars, trigger a redeploy. The build automatically runs `prisma db push` to set up your database tables — no manual migration needed.

That's it — your site is live.

---

## Make it your own

This repo ships with **neutral placeholder content** ("Your Name", "Your Title", `you@example.com`, …) — there's nothing to edit in the source code to rebrand it. Everything that identifies the site is editable from the admin panel and stored in your database:

1. Deploy, then log in at `yourdomain.com/admin`.
2. Go to **Admin → Landing page** and fill in each section:
   - **Navbar / Hero** — your name, title, tagline, profile image, social links.
   - **About / Contact / Footer** — bio, skills, email, contact links, copyright.
   - **SEO & identity** — site name, author, tagline and role used in browser tab titles, Google results and social share cards. Leave any field blank and it automatically reuses your Navbar brand / Hero values, so you only enter things once.
3. Set `NEXT_PUBLIC_SITE_URL` to your domain (used for canonical links and share-image URLs).
4. Optionally drop a `public/headshot.jpg` (or set an image URL in the Hero section) to replace the placeholder avatar.

No code changes, redeploys, or rebuilds are needed to change content — saving in the admin updates the live site immediately.

---

## Admin panel

Visit `yourdomain.com/admin` to log in. Email 2FA is required when signing in from a new browser.

| URL | Purpose |
|---|---|
| `/admin` | Dashboard |
| `/admin/posts` | Write and manage blog posts |
| `/admin/projects` | Manage portfolio projects (drag to reorder) |
| `/admin/tags` | Manage blog tags |
| `/admin/site-content` | Edit all landing-page content, SEO & identity, and section visibility |

---

## Run locally

```bash
# 1. Clone and install
git clone https://github.com/yourusername/yourrepo.git
cd yourrepo
npm install

# 2. Copy env file and fill in values
cp .env.example .env.local

# 3. Set up database (Neon free tier or local Postgres)
npx prisma db push

# 4. Start
npm run dev
```

Open [localhost:3000](http://localhost:3000) for the site, [localhost:3000/admin](http://localhost:3000/admin) for the CMS.

---

## Useful commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript check
npm test             # Run tests

npx prisma studio    # Visual database browser (localhost:5555)
```

---

## Tech stack

Next.js 16 · Tailwind CSS v4 · Prisma 7 · PostgreSQL · NextAuth v5 · Tiptap v3 · Vercel Blob · Jest 30
