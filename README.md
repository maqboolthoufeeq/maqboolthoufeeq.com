# maqboolthoufeeq.com

Personal portfolio and blog for Maqbool Thoufeeq — Full-Stack Developer.
Built with Next.js 16, Tailwind CSS v4, Prisma + PostgreSQL, NextAuth v5, Tiptap, and Vercel Blob.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4, CSS custom properties, dark/light toggle |
| Database | PostgreSQL via Prisma ORM v7 |
| Auth | NextAuth v5 (credentials, JWT session) |
| Rich text | Tiptap v3 (StarterKit, Link, Image, Placeholder) |
| File storage | Vercel Blob |
| Fonts | Geist Sans |
| Testing | Jest 30 + ts-jest |

---

## Local development

### 1. Prerequisites

- Node.js 20+
- A PostgreSQL database (local or hosted — see options below)
- Git

### 2. Clone and install

```bash
git clone <your-repo-url>
cd maqboolthoufeeqdotcom
npm install
```

### 3. Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Open `.env.local` and set:

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/portfolio?sslmode=disable

# NextAuth v5 — generate with: openssl rand -base64 32
AUTH_SECRET=your-32-char-random-secret

# Admin login credentials
ADMIN_EMAIL=you@example.com

# Option A: plain password (dev only, never in production)
ADMIN_PASSWORD=yourpassword

# Option B: bcrypt hash (recommended even locally)
# Generate with: node -e "require('bcryptjs').hash('yourpassword',12).then(console.log)"
ADMIN_PASSWORD_HASH=$2b$12$...

# Vercel Blob token (optional locally — upload feature won't work without it)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

> You only need one of `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH`. In production always use the hash.

### 4. Set up the database

```bash
# Push the Prisma schema to your database (creates tables)
npx prisma db push

# Optional: open Prisma Studio to browse data
npx prisma studio
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — public site.
Open [http://localhost:3000/admin](http://localhost:3000/admin) — admin CMS (redirects to login).

---

## Local PostgreSQL options

### Option A: Docker (easiest)

```bash
docker run -d \
  --name portfolio-db \
  -e POSTGRES_USER=portfolio \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=portfolio \
  -p 5432:5432 \
  postgres:16
```

Then set:
```env
DATABASE_URL=postgresql://portfolio:secret@localhost:5432/portfolio?sslmode=disable
```

### Option B: Homebrew (Mac)

```bash
brew install postgresql@16
brew services start postgresql@16
createdb portfolio
```

Then set:
```env
DATABASE_URL=postgresql://$(whoami)@localhost:5432/portfolio?sslmode=disable
```

### Option C: Free hosted (no local install)

Use [Neon](https://neon.tech) or [Supabase](https://supabase.com) — both have free tiers.
Copy the connection string they give you directly into `DATABASE_URL`.

---

## Available commands

```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build
npm run start        # Run production build locally
npm run lint         # ESLint
npm test             # Jest test suite (30 tests)
npm run test:watch   # Jest in watch mode

npx prisma db push   # Sync schema → database (no migration files)
npx prisma studio    # Visual database browser at localhost:5555
npx prisma generate  # Regenerate Prisma client after schema changes
```

---

## Project structure

```
app/
  (public)/
    blog/
      page.tsx              # Blog listing
      [slug]/page.tsx       # Individual post
  admin/
    layout.tsx              # Auth guard — redirects to /admin/login if not signed in
    page.tsx                # Dashboard (post count, project count)
    login/page.tsx          # Sign-in form
    posts/
      page.tsx              # Post list with delete
      new/page.tsx          # Create post (Tiptap editor)
      [id]/edit/page.tsx    # Edit post
    projects/
      page.tsx              # Project list with drag-to-reorder
      new/page.tsx          # Create project
      [id]/edit/page.tsx    # Edit project
  api/
    auth/[...nextauth]/     # NextAuth handler
    posts/                  # CRUD — GET public, write requires session
    projects/               # CRUD — GET public, write requires session
    upload/                 # Vercel Blob upload (auth required, 5 MB max)
  layout.tsx                # Root layout — ThemeProvider, Geist font
  page.tsx                  # Homepage (Hero, About, Projects, Blog preview, Contact)
  globals.css               # Tailwind + CSS variables + glow utility + scrollbar

components/
  Navbar.tsx                # Sticky header with nav links and theme toggle
  ThemeToggle.tsx           # Sun/Moon button
  sections/                 # Homepage sections (Hero, About, Projects, BlogPreview, Contact)
  blog/                     # PostCard, PostContent (DOMPurify-sanitized)
  admin/                    # Editor (Tiptap), PostTable, ProjectList (dnd-kit), ProjectForm

lib/
  auth.ts                   # NextAuth config
  prisma.ts                 # Prisma client singleton
  blob.ts                   # Vercel Blob upload helper
  utils.ts                  # readingTime, slugify, cn

prisma/
  schema.prisma             # Project and Post models
```

---

## Vercel deployment

### 1. Push to GitHub

```bash
git remote add origin https://github.com/yourusername/maqboolthoufeeqdotcom.git
git push -u origin main
```

### 2. Import on Vercel

Go to [vercel.com/new](https://vercel.com/new), import your GitHub repo.
Framework preset: **Next.js** (auto-detected).

### 3. Add a Postgres database

In your Vercel project → **Storage** tab → **Create Database** → choose any Postgres provider (e.g. Neon).
Vercel will automatically set `DATABASE_URL` in your environment.

Alternatively, create a free [Neon](https://neon.tech) database manually and paste the connection string.

### 4. Add a Blob store

In your Vercel project → **Storage** tab → **Create Blob Store**.
Vercel will automatically set `BLOB_READ_WRITE_TOKEN`.

### 5. Set environment variables

In your Vercel project → **Settings** → **Environment Variables**, add:

| Variable | Value | Notes |
|---|---|---|
| `AUTH_SECRET` | `openssl rand -base64 32` | Required for NextAuth v5 |
| `ADMIN_EMAIL` | `you@example.com` | Your admin login email |
| `ADMIN_PASSWORD_HASH` | bcrypt hash (see below) | Never use plain password in prod |
| `DATABASE_URL` | Set automatically if using Vercel Postgres | |
| `BLOB_READ_WRITE_TOKEN` | Set automatically if using Vercel Blob | |

**Generate `AUTH_SECRET`:**
```bash
openssl rand -base64 32
```

**Generate `ADMIN_PASSWORD_HASH`:**
```bash
node -e "require('bcryptjs').hash('YourStrongPassword123!', 12).then(console.log)"
```
Copy the output (`$2b$12$...`) into the `ADMIN_PASSWORD_HASH` env var.

### 6. Run the database migration

After first deploy, run from your local machine (pointing at the production database):

```bash
DATABASE_URL="your-production-db-url" npx prisma db push
```

Or use Prisma's [Data Proxy](https://www.prisma.io/docs/data-platform/data-proxy) / Vercel's built-in migration step.

### 7. Deploy

Vercel deploys automatically on every push to `main`. For manual deploys:

```bash
# Install Vercel CLI (one-time)
npm i -g vercel

# Deploy to production
vercel --prod
```

---

## Admin CMS usage

| URL | Purpose |
|---|---|
| `/admin` | Dashboard — stats overview, sign out |
| `/admin/posts` | List all posts (published + drafts), delete |
| `/admin/posts/new` | Create post — rich text editor, excerpt, publish toggle |
| `/admin/posts/:id/edit` | Edit existing post |
| `/admin/projects` | List projects, drag rows to reorder display order |
| `/admin/projects/new` | Create project — tech stack, URLs, image upload, featured flag |
| `/admin/projects/:id/edit` | Edit existing project |

**Featured projects** (`featured: true`) appear on the homepage Projects section.
**Unpublished posts** are only visible in the admin — the public blog only shows published posts.
**Display order** for projects is set by dragging rows in the project list.

---

## Customising content

### Headshot
Replace `public/headshot.jpg` with your own photo (recommended: square, minimum 400×400 px).

### Bio and skills
Edit `components/sections/About.tsx` — update the `SKILLS` array and the bio paragraph.

### Social links
Edit `components/sections/Contact.tsx` — update the `LINKS` array with your GitHub, LinkedIn, and email.

### Accent colour
Edit `app/globals.css`:
```css
:root    { --accent: #7c3aed; }  /* light mode */
.dark    { --accent: #a855f7; }  /* dark mode */
```

---

## Security notes

- All write API routes (`POST /api/posts`, `PATCH`, `DELETE`, etc.) check `auth()` and return 401 if no session.
- Image uploads validate MIME type and enforce a 5 MB limit.
- Blog post HTML is sanitized with DOMPurify before rendering.
- Admin password is bcrypt-hashed with cost factor 12.
- `AUTH_SECRET` must be set — NextAuth v5 will throw at runtime if it's missing.
- Never commit `.env.local` or any file containing secrets.

---

## Running tests

```bash
npm test
```

Tests cover: `readingTime`, `slugify`, `cn` utilities, and Prisma model field validation (30 tests total, no database required).
