# maqboolthoufeeq.com — Portfolio Site Design Spec

**Date:** 2026-05-19  
**Status:** Approved

---

## Overview

A full personal website for Maqbool Thoufeeq (Full-Stack Developer) 15 App Router. The site has a dark-first aesthetic with a light/dark toggle, a database-backed portfolio and blog, and a private admin CMS for managing content without touching code.

---

## Architecture

Single Next.js 15 App Router project — frontend and backend in one codebase, deployed on Vercel.

```
maqboolthoufeeqdotcom/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                  # Homepage
│   │   ├── blog/
│   │   │   ├── page.tsx              # Blog listing
│   │   │   └── [slug]/page.tsx       # Blog post
│   ├── admin/
│   │   ├── login/page.tsx
│   │   ├── page.tsx                  # Dashboard
│   │   ├── posts/
│   │   │   ├── page.tsx              # Post list
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── projects/
│   │       ├── page.tsx              # Project list
│   │       ├── new/page.tsx
│   │       └── [id]/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── posts/route.ts
│       ├── posts/[id]/route.ts
│       ├── projects/route.ts
│       └── projects/[id]/route.ts
├── components/
│   ├── sections/                     # Hero, About, Projects, Stack, Contact
│   ├── blog/                         # PostCard, PostContent
│   ├── admin/                        # Editor, ProjectForm, PostTable
│   └── ui/                           # shadcn/ui components
├── lib/
│   ├── prisma.ts                     # Prisma client singleton
│   ├── auth.ts                       # NextAuth config
│   └── blob.ts                       # Vercel Blob helpers
└── prisma/
    └── schema.prisma
```

**Deployment:** Vercel (free tier)  
**Database:** Neon Postgres (serverless, free tier)  
**Images:** Vercel Blob (free 1 GB)  
**Auth:** NextAuth v5 credentials provider

---

## Public Pages

### Homepage (`/`)

Single scrolling page with these sections in order:

1. **Hero** — Headshot photo (circular, purple glow ring), greeting, name, title ("Full-Stack Developer"), one-line bio, two CTAs: "View Work" (scrolls to projects) and "Contact Me" (scrolls to contact)
2. **About** — Two-column on desktop (bio paragraph left, highlight stats right), stacks to single column on mobile. Stats examples: years of experience, open-to-work status.
3. **Projects** — Grid of project cards pulled from DB (`visible = true`, sorted by `order`). Featured projects render with a purple glow border. Each card: image, title, description, tags, live link, GitHub link.
4. **Tech Stack** — Logo grid of technologies (static, hardcoded — not DB-driven)
5. **Contact** — Email address, GitHub link, LinkedIn link, short invite message

### Blog listing (`/blog`)

Grid of published post cards: cover image, title, excerpt, tags, date. Sorted by `publishedAt` descending.

### Blog post (`/blog/[slug]`)

Full post rendered from Tiptap HTML. Supports inline images, YouTube embeds (`<iframe>`), headings, lists, blockquotes. Shows cover image, title, date, tags, reading time estimate.

---

## Admin CMS (`/admin/*`)

All routes redirect to `/admin/login` if no valid NextAuth session.

### Login (`/admin/login`)
Email + password form. Credentials checked against `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars. Session cookie — 30 day expiry.

### Dashboard (`/admin`)
Stats: total posts, published posts, total projects, visible projects. Quick-action buttons: "New Post", "New Project".

### Post management
- **List** (`/admin/posts`): table of all posts — title, status badge (draft/published), date, inline publish toggle, Edit and Delete actions.
- **Editor** (`/admin/posts/new` and `/admin/posts/[id]`):
  - Tiptap rich text editor (bold, italic, headings H1–H3, bullet/numbered lists, blockquotes, code blocks)
  - Image upload to Vercel Blob, inserted inline at cursor
  - YouTube embed: paste URL → auto-converts to responsive `<iframe>`
  - Cover image upload
  - Tags (comma-separated input, stored as `String[]`)
  - Slug — auto-generated from title on creation, manually editable
  - Save Draft / Publish buttons

### Project management
- **List** (`/admin/projects`): cards with drag handles for reordering (persisted to `order` field), visible/hidden toggle, Edit and Delete actions.
- **Editor** (`/admin/projects/new` and `/admin/projects/[id]`): title, description (textarea), image upload, live URL, GitHub URL, tags, featured toggle, visible toggle.

---

## Data Model

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Project {
  id          String   @id @default(cuid())
  title       String
  description String
  image       String?
  url         String?
  githubUrl   String?
  tags        String[]
  featured    Boolean  @default(false)
  visible     Boolean  @default(true)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Post {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  excerpt     String?
  content     String
  coverImage  String?
  tags        String[]
  published   Boolean   @default(false)
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

---

## Visual Design System

### Colours

| Token | Dark mode | Light mode |
|-------|-----------|------------|
| Background | `#0d0d0f` | `#f8fafc` |
| Surface | `#111118` | `#ffffff` |
| Border | `#1f1f2e` | `#e2e8f0` |
| Primary accent | `#a855f7` | `#7c3aed` |
| Text primary | `#f8fafc` | `#0f172a` |
| Text muted | `#6b7280` | `#64748b` |

### Typography
- Font: **Inter** (Google Fonts) or **Geist Sans** (Vercel)
- Heading weight: 800, letter-spacing: -0.5px
- Body: 400/500, line-height: 1.6

### Components
- Card border-radius: 8–12px
- Featured project cards: `border: 1px solid rgba(168,85,247,0.3)` + `box-shadow: 0 0 14px rgba(168,85,247,0.12)`
- Buttons: filled (`bg-purple-500`) and outlined (`border-purple-500`)
- Dark/light toggle: ☀️/🌙 icon in navbar, uses `next-themes`

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| ORM | Prisma |
| Database | Neon Postgres |
| Auth | NextAuth v5 (credentials) |
| Rich text | Tiptap |
| Image storage | Vercel Blob |
| Deployment | Vercel |
| Theme toggle | next-themes |

---

## Environment Variables

```
DATABASE_URL=           # Neon Postgres connection string
NEXTAUTH_SECRET=        # Random 32-char secret
NEXTAUTH_URL=           # https://maqboolthoufeeq.com
ADMIN_EMAIL=            # Admin login email
ADMIN_PASSWORD=         # Admin login password (compared with bcrypt at login)
BLOB_READ_WRITE_TOKEN=  # Vercel Blob token
```

---

## Out of Scope

- Multiple admin users / roles
- Comments on blog posts
- RSS feed (can be added later)
- Analytics (can add Vercel Analytics post-launch)
- Search (can add later)
