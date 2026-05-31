# Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build example.com — a full portfolio site with dark-glow aesthetic, headshot hero, blog, and admin CMS, deployed on Vercel.

**Architecture:** Next.js 15 App Router single codebase. Public routes serve the portfolio (Hero/About/Projects/Stack/Contact) and blog from Neon Postgres via Prisma. Admin routes (/admin/*) protected by NextAuth v5 credentials provide a CMS for posts and projects. Vercel Blob stores uploaded images.

**Tech Stack:** Next.js 15, Tailwind CSS v4, shadcn/ui, Prisma, Neon Postgres, NextAuth v5, Tiptap, Vercel Blob, next-themes, @dnd-kit, DOMPurify

---

## File Map

| File | Responsibility |
|------|----------------|
| `app/layout.tsx` | Root layout — ThemeProvider, fonts, global CSS |
| `app/(public)/layout.tsx` | Public layout — Navbar + footer |
| `app/(public)/page.tsx` | Homepage — assembles all sections |
| `app/(public)/blog/page.tsx` | Blog listing — fetches published posts |
| `app/(public)/blog/[slug]/page.tsx` | Blog post — renders sanitized Tiptap HTML |
| `app/admin/layout.tsx` | Admin shell — session guard, sidebar nav |
| `app/admin/login/page.tsx` | Credentials login form |
| `app/admin/page.tsx` | Dashboard — stats + quick-action buttons |
| `app/admin/posts/page.tsx` | Post list table |
| `app/admin/posts/new/page.tsx` | New post editor |
| `app/admin/posts/[id]/page.tsx` | Edit post editor |
| `app/admin/projects/page.tsx` | Project list with drag-to-reorder |
| `app/admin/projects/new/page.tsx` | New project form |
| `app/admin/projects/[id]/page.tsx` | Edit project form |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth handler |
| `app/api/posts/route.ts` | GET list + POST |
| `app/api/posts/[id]/route.ts` | GET one + PATCH + DELETE |
| `app/api/projects/route.ts` | GET list + POST |
| `app/api/projects/[id]/route.ts` | GET one + PATCH + DELETE |
| `app/api/upload/route.ts` | POST — Vercel Blob upload |
| `components/Navbar.tsx` | Top nav with theme toggle + anchor links |
| `components/ThemeToggle.tsx` | Sun/Moon toggle button |
| `components/sections/HeroSection.tsx` | Hero — headshot, name, title, CTAs |
| `components/sections/AboutSection.tsx` | About — bio + stats |
| `components/sections/ProjectsSection.tsx` | Projects grid from DB |
| `components/sections/TechStackSection.tsx` | Tech logo grid (static) |
| `components/sections/ContactSection.tsx` | Contact — links |
| `components/blog/PostCard.tsx` | Blog listing card |
| `components/blog/PostContent.tsx` | Renders DOMPurify-sanitized Tiptap HTML |
| `components/admin/PostTable.tsx` | Table with publish toggle + actions |
| `components/admin/PostEditor.tsx` | Tiptap editor + cover image + metadata |
| `components/admin/ProjectList.tsx` | @dnd-kit sortable project list |
| `components/admin/ProjectForm.tsx` | Project create/edit form |
| `components/admin/ImageUpload.tsx` | Drag-drop image uploader to Vercel Blob |
| `lib/prisma.ts` | Prisma client singleton |
| `lib/auth.ts` | NextAuth config |
| `lib/blob.ts` | Vercel Blob upload helper |
| `lib/utils.ts` | cn(), slugify(), readingTime() |
| `prisma/schema.prisma` | Project + Post models |
| `__tests__/lib/utils.test.ts` | Unit tests for lib/utils |
| `__tests__/api/posts.test.ts` | API route tests for posts |
| `__tests__/api/projects.test.ts` | API route tests for projects |

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json` (via create-next-app)
- Create: `tailwind.config.ts`
- Create: `.env.local`
- Create: `.env.example`

- [ ] **Step 1: Scaffold the Next.js 15 project**

```bash
cd ~/projects
npx create-next-app@latest portfolio-site \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"
```

If the directory already exists and has files, scaffold in a temp dir and copy `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts` manually.

- [ ] **Step 2: Install all dependencies**

```bash
cd ~/projects/portfolio-site
npm install \
  geist \
  @prisma/client \
  next-auth@beta \
  @auth/prisma-adapter \
  @tiptap/react \
  @tiptap/starter-kit \
  @tiptap/extension-image \
  @tiptap/extension-youtube \
  @tiptap/extension-placeholder \
  @vercel/blob \
  next-themes \
  @dnd-kit/core \
  @dnd-kit/sortable \
  @dnd-kit/utilities \
  bcryptjs \
  dompurify \
  jsdom \
  class-variance-authority \
  clsx \
  tailwind-merge \
  lucide-react \
  @tailwindcss/typography

npm install --save-dev \
  prisma \
  @types/bcryptjs \
  @types/dompurify \
  @types/jsdom \
  jest \
  jest-environment-node \
  @types/jest \
  ts-jest
```

- [ ] **Step 3: Install shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Slate
- CSS variables: Yes

Then add the components we'll use:

```bash
npx shadcn@latest add button badge card input label textarea switch table dialog dropdown-menu separator toast
```

- [ ] **Step 4: Create .env.local from example**

Create `.env.example`:

```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
NEXTAUTH_SECRET=replace-with-32-char-secret
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-strong-password
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

Copy to `.env.local` and fill with real values before proceeding.

- [ ] **Step 5: Configure jest**

Create `jest.config.ts`:

```typescript
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathPattern: '__tests__',
}

export default config
```

Add to `package.json` scripts:

```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 6: Commit scaffold**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts tailwind.config.ts jest.config.ts .env.example components.json
git commit -m "chore: scaffold Next.js 15 project with dependencies"
```

---

### Task 2: Prisma Schema + Database

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Initialise Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

This creates `prisma/schema.prisma` and adds `DATABASE_URL` to `.env`.

- [ ] **Step 2: Write the schema**

Replace `prisma/schema.prisma` with:

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

- [ ] **Step 3: Push schema to Neon**

Ensure `DATABASE_URL` in `.env.local` is set to the Neon connection string, then:

```bash
npx prisma db push
```

Expected output: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 4: Generate Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Prisma schema for Project and Post models"
```

---

### Task 3: Library Utilities

**Files:**
- Create: `lib/utils.ts`
- Create: `lib/prisma.ts`
- Create: `lib/blob.ts`
- Create: `__tests__/lib/utils.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/utils.test.ts`:

```typescript
import { cn, slugify, readingTime } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('resolves Tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('ignores falsy values', () => {
    expect(cn('a', false && 'b', undefined)).toBe('a')
  })
})

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(slugify('My Post! #1')).toBe('my-post-1')
  })

  it('collapses multiple hyphens', () => {
    expect(slugify('a  b')).toBe('a-b')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify(' hello ')).toBe('hello')
  })
})

describe('readingTime', () => {
  it('returns 1 for short content', () => {
    expect(readingTime('word '.repeat(50))).toBe(1)
  })

  it('returns correct minutes for longer content', () => {
    expect(readingTime('word '.repeat(400))).toBe(2)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/lib/utils.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/utils'`

- [ ] **Step 3: Implement lib/utils.ts**

Create `lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function readingTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/lib/utils.test.ts
```

Expected: PASS (3 suites, all green)

- [ ] **Step 5: Create lib/prisma.ts**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 6: Create lib/blob.ts**

```typescript
import { put } from '@vercel/blob'

export async function uploadImage(file: File, prefix = 'uploads'): Promise<string> {
  const filename = `${prefix}/${Date.now()}-${file.name}`
  const { url } = await put(filename, file, { access: 'public' })
  return url
}
```

- [ ] **Step 7: Commit**

```bash
git add lib/utils.ts lib/prisma.ts lib/blob.ts __tests__/lib/utils.test.ts
git commit -m "feat: add lib utilities (cn, slugify, readingTime, prisma singleton, blob upload)"
```

---

### Task 4: NextAuth Configuration

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create lib/auth.ts**

```typescript
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (credentials?.email !== process.env.ADMIN_EMAIL) {
          return null
        }
        const stored = process.env.ADMIN_PASSWORD ?? ''
        const isHashed = stored.startsWith('$2')
        const valid = isHashed
          ? await bcrypt.compare(String(credentials.password), stored)
          : credentials.password === stored
        if (!valid) return null
        return { id: '1', email: process.env.ADMIN_EMAIL, name: 'Admin' }
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/admin/login' },
})
```

- [ ] **Step 2: Create the NextAuth route handler**

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
```

- [ ] **Step 3: Verify the auth module compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to auth files.

- [ ] **Step 4: Commit**

```bash
git add lib/auth.ts app/api/auth
git commit -m "feat: add NextAuth v5 credentials provider for admin login"
```

---

### Task 5: Global Layout and Theme

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Create: `components/ThemeToggle.tsx`

- [ ] **Step 1: Update app/globals.css**

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

:root {
  --background: #f8fafc;
  --surface: #ffffff;
  --border: #e2e8f0;
  --foreground: #0f172a;
  --muted: #64748b;
  --accent: #7c3aed;
}

.dark {
  --background: #0d0d0f;
  --surface: #111118;
  --border: #1f1f2e;
  --foreground: #f8fafc;
  --muted: #6b7280;
  --accent: #a855f7;
}

body {
  background-color: var(--background);
  color: var(--foreground);
}

* {
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}
```

- [ ] **Step 2: Create ThemeToggle component**

Create `components/ThemeToggle.tsx`:

```typescript
'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
```

- [ ] **Step 3: Update app/layout.tsx**

```typescript
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { ThemeProvider } from 'next-themes'
import './globals.css'

export const metadata: Metadata = {
  title: 'title',
  description: 'description',
  metadataBase: new URL('https://example.com'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={GeistSans.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/globals.css components/ThemeToggle.tsx
git commit -m "feat: add root layout, global CSS with dark/light tokens, ThemeToggle"
```

---

### Task 6: Navbar

**Files:**
- Create: `components/Navbar.tsx`

- [ ] **Step 1: Create Navbar.tsx**

```typescript
'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const links = [
  { label: 'About', href: '#about' },
  { label: 'Work', href: '#projects' },
  { label: 'Blog', href: '/blog' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm">
      <nav className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold tracking-tight text-sm">
          example.com
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              {l.label}
            </a>
          ))}
          <Button asChild size="sm" className="bg-[var(--accent)] hover:bg-[var(--accent)]/90">
            <a href="#contact">Contact</a>
          </Button>
          <ThemeToggle />
        </div>

        <button className="md:hidden" onClick={() => setOpen(o => !o)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--background)] px-4 py-4 flex flex-col gap-4">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-[var(--muted)]"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <a href="#contact" onClick={() => setOpen(false)} className="text-sm text-[var(--accent)]">
            Contact
          </a>
          <ThemeToggle />
        </div>
      )}
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/Navbar.tsx
git commit -m "feat: add Navbar with anchor links, mobile menu, and theme toggle"
```

---

### Task 7: API Routes — Projects

**Files:**
- Create: `app/api/projects/route.ts`
- Create: `app/api/projects/[id]/route.ts`
- Create: `__tests__/api/projects.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/api/projects.test.ts`:

```typescript
import { prisma } from '@/lib/prisma'

const API = 'http://localhost:3000/api/projects'

describe('Projects API', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('GET /api/projects returns array', async () => {
    const res = await fetch(API)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })

  it('POST /api/projects creates a project', async () => {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Project',
        description: 'Test description',
        tags: ['React'],
      }),
    })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.title).toBe('Test Project')
    await prisma.project.delete({ where: { id: data.id } })
  })
})
```

These are integration tests that require the dev server running (`npm run dev` in another terminal).

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/api/projects.test.ts
```

Expected: FAIL — routes don't exist yet.

- [ ] **Step 3: Create app/api/projects/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const projects = await prisma.project.findMany({
    where: { visible: true },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, description, image, url, githubUrl, tags, featured, visible, order } = body

  if (!title || !description) {
    return NextResponse.json({ error: 'title and description are required' }, { status: 400 })
  }

  const project = await prisma.project.create({
    data: {
      title,
      description,
      image: image ?? null,
      url: url ?? null,
      githubUrl: githubUrl ?? null,
      tags: tags ?? [],
      featured: featured ?? false,
      visible: visible ?? true,
      order: order ?? 0,
    },
  })
  return NextResponse.json(project, { status: 201 })
}
```

- [ ] **Step 4: Create app/api/projects/[id]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(project)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const project = await prisma.project.update({ where: { id }, data: body })
  return NextResponse.json(project)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.project.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 5: Start dev server and run tests**

```bash
# Terminal 1
npm run dev

# Terminal 2
npx jest __tests__/api/projects.test.ts
```

Expected: PASS — both tests green.

- [ ] **Step 6: Commit**

```bash
git add app/api/projects __tests__/api/projects.test.ts
git commit -m "feat: add Projects API routes (GET, POST, PATCH, DELETE)"
```

---

### Task 8: API Routes — Posts

**Files:**
- Create: `app/api/posts/route.ts`
- Create: `app/api/posts/[id]/route.ts`
- Create: `__tests__/api/posts.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/api/posts.test.ts`:

```typescript
import { prisma } from '@/lib/prisma'

const API = 'http://localhost:3000/api/posts'

describe('Posts API', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('GET /api/posts returns only published posts', async () => {
    const res = await fetch(API)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    data.forEach((p: { published: boolean }) => {
      expect(p.published).toBe(true)
    })
  })

  it('POST /api/posts creates a draft', async () => {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Post',
        slug: 'test-post-unique-123',
        content: '<p>Hello</p>',
        tags: [],
      }),
    })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.published).toBe(false)
    await prisma.post.delete({ where: { id: data.id } })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/api/posts.test.ts
```

Expected: FAIL — routes don't exist yet.

- [ ] **Step 3: Create app/api/posts/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const admin = req.nextUrl.searchParams.get('admin') === 'true'
  const posts = await prisma.post.findMany({
    where: admin ? {} : { published: true },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      tags: true,
      published: true,
      publishedAt: true,
      createdAt: true,
    },
  })
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, slug, excerpt, content, coverImage, tags, published } = body

  if (!title || !slug || !content) {
    return NextResponse.json({ error: 'title, slug, and content are required' }, { status: 400 })
  }

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      excerpt: excerpt ?? null,
      content,
      coverImage: coverImage ?? null,
      tags: tags ?? [],
      published: published ?? false,
      publishedAt: published ? new Date() : null,
    },
  })
  return NextResponse.json(post, { status: 201 })
}
```

- [ ] **Step 4: Create app/api/posts/[id]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(post)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  if (body.published === true) {
    const existing = await prisma.post.findUnique({ where: { id }, select: { publishedAt: true } })
    if (!existing?.publishedAt) body.publishedAt = new Date()
  }
  if (body.published === false) {
    body.publishedAt = null
  }

  const post = await prisma.post.update({ where: { id }, data: body })
  return NextResponse.json(post)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.post.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 5: Run tests**

```bash
npx jest __tests__/api/posts.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/api/posts __tests__/api/posts.test.ts
git commit -m "feat: add Posts API routes (GET, POST, PATCH, DELETE)"
```

---

### Task 9: Upload API Route

**Files:**
- Create: `app/api/upload/route.ts`

- [ ] **Step 1: Create app/api/upload/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filename = `uploads/${Date.now()}-${safeName}`
  const { url } = await put(filename, file, { access: 'public' })
  return NextResponse.json({ url })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/upload/route.ts
git commit -m "feat: add image upload route using Vercel Blob"
```

---

### Task 10: Homepage Sections

**Files:**
- Create: `components/sections/HeroSection.tsx`
- Create: `components/sections/AboutSection.tsx`
- Create: `components/sections/ProjectsSection.tsx`
- Create: `components/sections/TechStackSection.tsx`
- Create: `components/sections/ContactSection.tsx`

- [ ] **Step 1: Create HeroSection.tsx**

Place your headshot photo at `public/headshot.jpg` before running the dev server.

```typescript
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <section id="hero" className="min-h-screen flex items-center pt-14">
      <div className="mx-auto max-w-5xl px-4 py-24 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-shrink-0">
          <div className="relative w-40 h-40 md:w-48 md:h-48">
            <div className="absolute inset-0 rounded-full bg-[var(--accent)]/30 blur-2xl" />
            <Image
              src="/headshot.jpg"
              alt="Your Name"
              width={192}
              height={192}
              className="relative rounded-full border-2 border-[var(--accent)]/60 object-cover w-full h-full"
              priority
            />
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Hello, I'm</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-2">
            Your Name
          </h1>
          <p className="text-[var(--accent)] font-medium mb-4">Full-Stack Developer</p>
          <p className="text-[var(--muted)] leading-relaxed max-w-md mb-8">
            Building fast, beautiful web products with React, Node.js, and everything in between.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Button asChild className="bg-[var(--accent)] hover:bg-[var(--accent)]/90">
              <a href="#projects">View Work</a>
            </Button>
            <Button asChild variant="outline" className="border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/10">
              <a href="#contact">Contact Me</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create AboutSection.tsx**

```typescript
export function AboutSection() {
  return (
    <section id="about" className="py-24 border-t border-[var(--border)]">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-3xl font-extrabold tracking-tight mb-12">About</h2>
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <p className="text-[var(--muted)] leading-relaxed">
              I'm a full-stack developer with a passion for building products that are both
              performant and beautiful. I work primarily with React and Node.js, and I'm always
              exploring new tools that improve developer experience and user outcomes.
            </p>
            <p className="text-[var(--muted)] leading-relaxed mt-4">
              I care deeply about clean code, thoughtful architecture, and shipping things that
              actually work.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'Years of Experience', value: '4+' },
              { label: 'Projects Shipped', value: '20+' },
              { label: 'Technologies', value: '15+' },
              { label: 'Status', value: 'Open to work' },
            ].map(stat => (
              <div key={stat.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                <p className="text-2xl font-extrabold text-[var(--accent)]">{stat.value}</p>
                <p className="text-xs text-[var(--muted)] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Create ProjectsSection.tsx**

```typescript
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Github } from 'lucide-react'
import Image from 'next/image'

export async function ProjectsSection() {
  const projects = await prisma.project.findMany({
    where: { visible: true },
    orderBy: { order: 'asc' },
  })

  return (
    <section id="projects" className="py-24 border-t border-[var(--border)]">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-3xl font-extrabold tracking-tight mb-12">Work</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div
              key={project.id}
              className={[
                'bg-[var(--surface)] rounded-xl border overflow-hidden flex flex-col',
                project.featured
                  ? 'border-[rgba(168,85,247,0.3)] shadow-[0_0_14px_rgba(168,85,247,0.12)]'
                  : 'border-[var(--border)]',
              ].join(' ')}
            >
              {project.image ? (
                <div className="relative h-40">
                  <Image src={project.image} alt={project.title} fill className="object-cover" />
                </div>
              ) : (
                <div className="h-40 bg-[var(--border)]/30 flex items-center justify-center text-[var(--muted)] text-xs">
                  No image
                </div>
              )}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm">{project.title}</h3>
                  <div className="flex gap-2 flex-shrink-0">
                    {project.githubUrl && (
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] hover:text-[var(--foreground)]">
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                    {project.url && (
                      <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] hover:text-[var(--foreground)]">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed mb-3 flex-1">{project.description}</p>
                <div className="flex flex-wrap gap-1">
                  {project.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[10px] bg-[var(--accent)]/10 text-[var(--accent)] border-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Create TechStackSection.tsx**

```typescript
const STACK = [
  { name: 'React', icon: 'React' },
  { name: 'Next.js', icon: 'Next.js' },
  { name: 'TypeScript', icon: 'TS' },
  { name: 'Node.js', icon: 'Node' },
  { name: 'PostgreSQL', icon: 'PG' },
  { name: 'Prisma', icon: 'Prisma' },
  { name: 'Tailwind CSS', icon: 'TW' },
  { name: 'Docker', icon: 'Docker' },
  { name: 'Git', icon: 'Git' },
  { name: 'Vercel', icon: 'Vercel' },
]

export function TechStackSection() {
  return (
    <section id="stack" className="py-24 border-t border-[var(--border)]">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-3xl font-extrabold tracking-tight mb-12">Tech Stack</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {STACK.map(tech => (
            <div
              key={tech.name}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col items-center gap-2 text-center hover:border-[var(--accent)]/50 transition-colors"
            >
              <span className="text-xs font-bold text-[var(--accent)]">{tech.icon}</span>
              <span className="text-xs text-[var(--muted)]">{tech.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

Note: Replace the `icon` text labels with actual SVG logos from [simpleicons.org](https://simpleicons.org) or a CDN for the finished site.

- [ ] **Step 5: Create ContactSection.tsx**

```typescript
import { Github, Linkedin, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ContactSection() {
  return (
    <section id="contact" className="py-24 border-t border-[var(--border)]">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight mb-4">Get In Touch</h2>
        <p className="text-[var(--muted)] max-w-md mx-auto mb-10">
          I'm open to new opportunities. Whether you have a project in mind, a question, or just want to say hi — reach out.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Button asChild variant="outline" className="border-[var(--border)] gap-2">
            <a href="mailto:you@example.com">
              <Mail className="h-4 w-4" /> Email
            </a>
          </Button>
          <Button asChild variant="outline" className="border-[var(--border)] gap-2">
            <a href="https://github.com/your-username" target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" /> GitHub
            </a>
          </Button>
          <Button asChild variant="outline" className="border-[var(--border)] gap-2">
            <a href="https://linkedin.com/in/your-username" target="_blank" rel="noopener noreferrer">
              <Linkedin className="h-4 w-4" /> LinkedIn
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add components/sections/
git commit -m "feat: add homepage sections (Hero, About, Projects, TechStack, Contact)"
```

---

### Task 11: Homepage Assembly

**Files:**
- Create: `app/(public)/layout.tsx`
- Create: `app/(public)/page.tsx`

- [ ] **Step 1: Create app/(public)/layout.tsx**

```typescript
import { Navbar } from '@/components/Navbar'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <footer className="border-t border-[var(--border)] py-8 text-center text-xs text-[var(--muted)]">
        {`© ${new Date().getFullYear()} Your Name`}
      </footer>
    </>
  )
}
```

- [ ] **Step 2: Create app/(public)/page.tsx**

```typescript
import { HeroSection } from '@/components/sections/HeroSection'
import { AboutSection } from '@/components/sections/AboutSection'
import { ProjectsSection } from '@/components/sections/ProjectsSection'
import { TechStackSection } from '@/components/sections/TechStackSection'
import { ContactSection } from '@/components/sections/ContactSection'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <ProjectsSection />
      <TechStackSection />
      <ContactSection />
    </>
  )
}
```

- [ ] **Step 3: Start dev server and verify homepage loads**

```bash
npm run dev
```

Open `http://localhost:3000` in the browser. Verify:
- Navbar appears, theme toggle works
- Hero section shows
- About section shows
- Projects section shows (empty grid if no DB records yet)
- Tech stack shows
- Contact section shows

- [ ] **Step 4: Commit**

```bash
git add "app/(public)/"
git commit -m "feat: assemble homepage with all sections"
```

---

### Task 12: Blog Listing Page

**Files:**
- Create: `components/blog/PostCard.tsx`
- Create: `app/(public)/blog/page.tsx`

- [ ] **Step 1: Create PostCard.tsx**

```typescript
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { readingTime } from '@/lib/utils'

interface PostCardProps {
  title: string
  slug: string
  excerpt?: string | null
  coverImage?: string | null
  tags: string[]
  publishedAt?: Date | string | null
  content?: string
}

export function PostCard({ title, slug, excerpt, coverImage, tags, publishedAt, content }: PostCardProps) {
  const date = publishedAt
    ? new Date(publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''
  const mins = content ? readingTime(content) : null

  return (
    <Link href={`/blog/${slug}`} className="group block bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--accent)]/40 transition-colors">
      {coverImage && (
        <div className="relative h-48">
          <Image src={coverImage} alt={title} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300" />
        </div>
      )}
      <div className="p-5">
        <h3 className="font-semibold mb-2 group-hover:text-[var(--accent)] transition-colors">{title}</h3>
        {excerpt && <p className="text-sm text-[var(--muted)] leading-relaxed mb-3 line-clamp-2">{excerpt}</p>}
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-[10px] bg-[var(--accent)]/10 text-[var(--accent)] border-0">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex gap-3 text-xs text-[var(--muted)]">
          {date && <span>{date}</span>}
          {mins && <span>· {mins} min read</span>}
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Create app/(public)/blog/page.tsx**

```typescript
import { prisma } from '@/lib/prisma'
import { PostCard } from '@/components/blog/PostCard'

export const revalidate = 60

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-24">
      <h1 className="text-4xl font-extrabold tracking-tight mb-12">Blog</h1>
      {posts.length === 0 ? (
        <p className="text-[var(--muted)]">No posts yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <PostCard key={post.id} {...post} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/blog/PostCard.tsx "app/(public)/blog/page.tsx"
git commit -m "feat: add blog listing page"
```

---

### Task 13: Blog Post Page

**Files:**
- Create: `components/blog/PostContent.tsx`
- Create: `app/(public)/blog/[slug]/page.tsx`

- [ ] **Step 1: Create PostContent.tsx**

Content stored in the database comes from Tiptap (our own editor, not user-submitted). We still sanitize with DOMPurify as a defence-in-depth measure, using the server-side compatible `isomorphic-dompurify` package (which uses jsdom on Node).

```bash
npm install isomorphic-dompurify
```

Create `components/blog/PostContent.tsx`:

```typescript
import DOMPurify from 'isomorphic-dompurify'

interface PostContentProps {
  html: string
}

export function PostContent({ html }: PostContentProps) {
  const clean = DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src'],
  })

  return (
    <div
      className="prose prose-invert dark:prose-invert max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-a:text-[var(--accent)] prose-img:rounded-xl"
      // Content originates from Tiptap (our own editor) and is sanitized by DOMPurify
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
```

- [ ] **Step 2: Create app/(public)/blog/[slug]/page.tsx**

```typescript
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PostContent } from '@/components/blog/PostContent'
import { Badge } from '@/components/ui/badge'
import { readingTime } from '@/lib/utils'
import Image from 'next/image'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.post.findUnique({ where: { slug } })
  if (!post) return {}
  return {
    title: `${post.title} — Your Name`,
    description: post.excerpt ?? undefined,
  }
}

export const revalidate = 60

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await prisma.post.findUnique({ where: { slug, published: true } })
  if (!post) notFound()

  const mins = readingTime(post.content)
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  return (
    <article className="mx-auto max-w-3xl px-4 py-24">
      {post.coverImage && (
        <div className="relative h-64 md:h-80 rounded-xl overflow-hidden mb-10">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
        </div>
      )}
      <div className="flex flex-wrap gap-1 mb-4">
        {post.tags.map(tag => (
          <Badge key={tag} variant="secondary" className="text-xs bg-[var(--accent)]/10 text-[var(--accent)] border-0">
            {tag}
          </Badge>
        ))}
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight mb-4">{post.title}</h1>
      <div className="flex gap-3 text-sm text-[var(--muted)] mb-10">
        {date && <span>{date}</span>}
        <span>·</span>
        <span>{mins} min read</span>
      </div>
      <PostContent html={post.content} />
    </article>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/blog/PostContent.tsx "app/(public)/blog/[slug]/page.tsx"
git commit -m "feat: add blog post page with DOMPurify-sanitized Tiptap HTML renderer"
```

---

### Task 14: Admin Login Page

**Files:**
- Create: `app/admin/login/page.tsx`

- [ ] **Step 1: Create app/admin/login/page.tsx**

```typescript
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      email: form.get('email'),
      password: form.get('password'),
      redirect: false,
    })
    setLoading(false)
    if (result?.ok) {
      router.push('/admin')
    } else {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8">
        <h1 className="text-xl font-bold mb-6">Admin Login</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required className="mt-1" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" disabled={loading} className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 mt-2">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Test login flow manually**

Navigate to `http://localhost:3000/admin/login`. Enter the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env.local`. Verify redirect to `/admin` on success and error message on wrong credentials.

- [ ] **Step 3: Commit**

```bash
git add app/admin/login/page.tsx
git commit -m "feat: add admin login page with NextAuth credentials"
```

---

### Task 15: Admin Layout and Dashboard

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`

- [ ] **Step 1: Create app/admin/layout.tsx**

```typescript
import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, FileText, Briefcase, LogOut } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/posts', label: 'Posts', icon: FileText },
  { href: '/admin/projects', label: 'Projects', icon: Briefcase },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/admin/login')

  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      <aside className="w-56 border-r border-[var(--border)] flex flex-col p-4 gap-1">
        <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4 px-2">Admin</p>
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] transition-colors"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
        <div className="mt-auto">
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/admin/login' })
            }}
          >
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2 text-[var(--muted)]">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Create app/admin/page.tsx**

```typescript
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [totalPosts, publishedPosts, totalProjects, visibleProjects] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { published: true } }),
    prisma.project.count(),
    prisma.project.count({ where: { visible: true } }),
  ])

  const stats = [
    { label: 'Total Posts', value: totalPosts },
    { label: 'Published Posts', value: publishedPosts },
    { label: 'Total Projects', value: totalProjects },
    { label: 'Visible Projects', value: visibleProjects },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(stat => (
          <div key={stat.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
            <p className="text-3xl font-extrabold">{stat.value}</p>
            <p className="text-xs text-[var(--muted)] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Button asChild className="bg-[var(--accent)] hover:bg-[var(--accent)]/90">
          <Link href="/admin/posts/new">New Post</Link>
        </Button>
        <Button asChild variant="outline" className="border-[var(--border)]">
          <Link href="/admin/projects/new">New Project</Link>
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify admin area**

Navigate to `http://localhost:3000/admin` (while logged in). Verify:
- Dashboard shows stats (all zeroes initially)
- Sidebar navigation works
- Unauthenticated access to `/admin` redirects to `/admin/login`

- [ ] **Step 4: Commit**

```bash
git add app/admin/layout.tsx app/admin/page.tsx
git commit -m "feat: add admin layout with sidebar and dashboard stats"
```

---

### Task 16: Admin Post List

**Files:**
- Create: `components/admin/PostTable.tsx`
- Create: `app/admin/posts/page.tsx`

- [ ] **Step 1: Create PostTable.tsx**

```typescript
'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Pencil, Trash2 } from 'lucide-react'
import type { Post } from '@prisma/client'

type PostRow = Pick<Post, 'id' | 'title' | 'slug' | 'published' | 'publishedAt' | 'createdAt'>

export function PostTable({ posts }: { posts: PostRow[] }) {
  const router = useRouter()

  async function togglePublish(id: string, published: boolean) {
    await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !published }),
    })
    router.refresh()
  }

  async function deletePost(id: string) {
    if (!confirm('Delete this post? This cannot be undone.')) return
    await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (posts.length === 0) {
    return <p className="text-[var(--muted)] text-sm">No posts yet.</p>
  }

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[var(--surface)] text-[var(--muted)] text-xs uppercase tracking-wider">
          <tr>
            <th className="text-left px-4 py-3">Title</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="text-left px-4 py-3">Date</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {posts.map(post => (
            <tr key={post.id} className="border-t border-[var(--border)] hover:bg-[var(--surface)]/50">
              <td className="px-4 py-3 font-medium">{post.title}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={post.published}
                    onCheckedChange={() => togglePublish(post.id, post.published)}
                    aria-label="Toggle published"
                  />
                  <Badge
                    variant="secondary"
                    className={
                      post.published
                        ? 'bg-green-500/10 text-green-400 border-0'
                        : 'bg-[var(--border)] text-[var(--muted)] border-0'
                    }
                  >
                    {post.published ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              </td>
              <td className="px-4 py-3 text-[var(--muted)]">
                {new Date(post.createdAt).toLocaleDateString('en-GB')}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button asChild size="icon" variant="ghost">
                    <Link href={`/admin/posts/${post.id}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deletePost(post.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Create app/admin/posts/page.tsx**

```typescript
import { prisma } from '@/lib/prisma'
import { PostTable } from '@/components/admin/PostTable'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, slug: true, published: true, publishedAt: true, createdAt: true },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Posts</h1>
        <Button asChild className="bg-[var(--accent)] hover:bg-[var(--accent)]/90">
          <Link href="/admin/posts/new">New Post</Link>
        </Button>
      </div>
      <PostTable posts={posts} />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/PostTable.tsx app/admin/posts/page.tsx
git commit -m "feat: add admin post list with publish toggle and delete"
```

---

### Task 17: Admin Post Editor (Tiptap)

**Files:**
- Create: `components/admin/ImageUpload.tsx`
- Create: `components/admin/PostEditor.tsx`
- Create: `app/admin/posts/new/page.tsx`
- Create: `app/admin/posts/[id]/page.tsx`

- [ ] **Step 1: Create ImageUpload.tsx**

```typescript
'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string) => void
  label?: string
}

export function ImageUpload({ value, onChange, label = 'Upload image' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()
    setUploading(false)
    if (data.url) onChange(data.url)
  }

  return (
    <div>
      {value && (
        <div className="relative h-40 w-full rounded-lg overflow-hidden mb-3">
          <Image src={value} alt="Uploaded" fill className="object-cover" />
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="border-[var(--border)] gap-2"
      >
        <Upload className="h-3.5 w-3.5" />
        {uploading ? 'Uploading…' : label}
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Create PostEditor.tsx**

```typescript
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TiptapImage from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Placeholder from '@tiptap/extension-placeholder'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { slugify } from '@/lib/utils'
import type { Post } from '@prisma/client'

export function PostEditor({ post }: { post?: Post }) {
  const router = useRouter()
  const [title, setTitle] = useState(post?.title ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '')
  const [tags, setTags] = useState(post?.tags.join(', ') ?? '')
  const [coverImage, setCoverImage] = useState<string | null>(post?.coverImage ?? null)
  const [saving, setSaving] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapImage,
      Youtube.configure({ controls: false }),
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    content: post?.content ?? '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
  })

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setTitle(val)
    if (!post) setSlug(slugify(val))
  }

  async function save(published: boolean) {
    if (!editor) return
    setSaving(true)
    const body = {
      title,
      slug,
      excerpt,
      content: editor.getHTML(),
      coverImage,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      published,
    }
    const url = post ? `/api/posts/${post.id}` : '/api/posts'
    const method = post ? 'PATCH' : 'POST'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    router.push('/admin/posts')
    router.refresh()
  }

  async function insertInlineImage() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file || !editor) return
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (data.url) editor.chain().focus().setImage({ src: data.url }).run()
    }
    input.click()
  }

  function insertYoutube() {
    const url = prompt('YouTube URL:')
    if (url && editor) editor.chain().focus().setYoutubeVideo({ src: url }).run()
  }

  const toolbarButtons = [
    { label: 'B', action: () => editor?.chain().focus().toggleBold().run() },
    { label: 'I', action: () => editor?.chain().focus().toggleItalic().run() },
    { label: 'H1', action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: 'H2', action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'H3', action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: '• List', action: () => editor?.chain().focus().toggleBulletList().run() },
    { label: '1. List', action: () => editor?.chain().focus().toggleOrderedList().run() },
    { label: 'Quote', action: () => editor?.chain().focus().toggleBlockquote().run() },
    { label: 'Code', action: () => editor?.chain().focus().toggleCode().run() },
    { label: 'Image', action: insertInlineImage },
    { label: 'YouTube', action: insertYoutube },
  ]

  return (
    <div className="max-w-3xl">
      <div className="flex flex-col gap-5 mb-6">
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={handleTitleChange} placeholder="Post title" className="mt-1 text-lg" />
        </div>
        <div>
          <Label>Slug</Label>
          <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="post-slug" className="mt-1 font-mono text-sm" />
        </div>
        <div>
          <Label>Excerpt</Label>
          <Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short summary shown in listings" className="mt-1" rows={2} />
        </div>
        <div>
          <Label>Tags (comma-separated)</Label>
          <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="React, Node.js, Prisma" className="mt-1" />
        </div>
        <div>
          <Label>Cover Image</Label>
          <div className="mt-1">
            <ImageUpload value={coverImage} onChange={setCoverImage} label="Upload cover image" />
          </div>
        </div>
      </div>

      <div className="border border-[var(--border)] rounded-xl overflow-hidden mb-6">
        <div className="flex gap-1 p-2 border-b border-[var(--border)] bg-[var(--surface)] flex-wrap">
          {toolbarButtons.map(btn => (
            <Button key={btn.label} type="button" size="sm" variant="ghost" onClick={btn.action} className="h-7 px-2 text-xs">
              {btn.label}
            </Button>
          ))}
        </div>
        <EditorContent editor={editor} />
      </div>

      <div className="flex gap-3">
        <Button onClick={() => save(false)} disabled={saving} variant="outline" className="border-[var(--border)]">
          {saving ? 'Saving…' : 'Save Draft'}
        </Button>
        <Button onClick={() => save(true)} disabled={saving} className="bg-[var(--accent)] hover:bg-[var(--accent)]/90">
          {saving ? 'Publishing…' : 'Publish'}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create app/admin/posts/new/page.tsx**

```typescript
import { PostEditor } from '@/components/admin/PostEditor'

export default function NewPostPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">New Post</h1>
      <PostEditor />
    </div>
  )
}
```

- [ ] **Step 4: Create app/admin/posts/[id]/page.tsx**

```typescript
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PostEditor } from '@/components/admin/PostEditor'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params
  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Edit Post</h1>
      <PostEditor post={post} />
    </div>
  )
}
```

- [ ] **Step 5: Test the editor manually**

Navigate to `http://localhost:3000/admin/posts/new`. Verify:
- Title auto-generates slug
- Tiptap toolbar works (bold, italic, headings, lists, blockquote, code)
- Image upload inserts image inline at cursor
- YouTube prompt embeds video
- Save Draft saves and redirects
- Publish button sets status to Published

- [ ] **Step 6: Commit**

```bash
git add components/admin/ImageUpload.tsx components/admin/PostEditor.tsx app/admin/posts/
git commit -m "feat: add admin post editor with Tiptap, image upload, YouTube embed"
```

---

### Task 18: Admin Project List (dnd-kit)

**Files:**
- Create: `components/admin/ProjectList.tsx`
- Create: `app/admin/projects/page.tsx`

- [ ] **Step 1: Create ProjectList.tsx**

```typescript
'use client'

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { Project } from '@prisma/client'

function SortableRow({
  project,
  onToggle,
  onDelete,
}: {
  project: Project
  onToggle: (id: string, visible: boolean) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: project.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 border border-[var(--border)] rounded-lg px-3 py-3 bg-[var(--surface)]"
    >
      <button {...attributes} {...listeners} className="cursor-grab text-[var(--muted)] touch-none" aria-label="Drag to reorder">
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 text-sm font-medium">{project.title}</span>
      <Switch checked={project.visible} onCheckedChange={() => onToggle(project.id, project.visible)} aria-label="Toggle visibility" />
      <Button asChild size="icon" variant="ghost">
        <Link href={`/admin/projects/${project.id}`}>
          <Pencil className="h-3.5 w-3.5" />
        </Link>
      </Button>
      <Button size="icon" variant="ghost" onClick={() => onDelete(project.id)}>
        <Trash2 className="h-3.5 w-3.5 text-red-400" />
      </Button>
    </div>
  )
}

export function ProjectList({ projects: initial }: { projects: Project[] }) {
  const router = useRouter()
  const [projects, setProjects] = useState(initial)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = projects.findIndex(p => p.id === active.id)
    const newIndex = projects.findIndex(p => p.id === over.id)
    const reordered = arrayMove(projects, oldIndex, newIndex)
    setProjects(reordered)

    await Promise.all(
      reordered.map((p, i) =>
        fetch(`/api/projects/${p.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: i }),
        }),
      ),
    )
    router.refresh()
  }

  async function toggleVisible(id: string, visible: boolean) {
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !visible }),
    })
    setProjects(ps => ps.map(p => (p.id === id ? { ...p, visible: !p.visible } : p)))
  }

  async function deleteProject(id: string) {
    if (!confirm('Delete this project? This cannot be undone.')) return
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    setProjects(ps => ps.filter(p => p.id !== id))
  }

  if (projects.length === 0) return <p className="text-[var(--muted)] text-sm">No projects yet.</p>

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {projects.map(project => (
            <SortableRow key={project.id} project={project} onToggle={toggleVisible} onDelete={deleteProject} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
```

- [ ] **Step 2: Create app/admin/projects/page.tsx**

```typescript
import { prisma } from '@/lib/prisma'
import { ProjectList } from '@/components/admin/ProjectList'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({ orderBy: { order: 'asc' } })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button asChild className="bg-[var(--accent)] hover:bg-[var(--accent)]/90">
          <Link href="/admin/projects/new">New Project</Link>
        </Button>
      </div>
      <ProjectList projects={projects} />
    </div>
  )
}
```

- [ ] **Step 3: Verify drag-to-reorder**

Add at least two projects, then drag to reorder. Reload and confirm order persisted in the database.

- [ ] **Step 4: Commit**

```bash
git add components/admin/ProjectList.tsx app/admin/projects/page.tsx
git commit -m "feat: add admin project list with drag-to-reorder using @dnd-kit"
```

---

### Task 19: Admin Project Form

**Files:**
- Create: `components/admin/ProjectForm.tsx`
- Create: `app/admin/projects/new/page.tsx`
- Create: `app/admin/projects/[id]/page.tsx`

- [ ] **Step 1: Create ProjectForm.tsx**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from '@/components/admin/ImageUpload'
import type { Project } from '@prisma/client'

export function ProjectForm({ project }: { project?: Project }) {
  const router = useRouter()
  const [title, setTitle] = useState(project?.title ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [image, setImage] = useState<string | null>(project?.image ?? null)
  const [url, setUrl] = useState(project?.url ?? '')
  const [githubUrl, setGithubUrl] = useState(project?.githubUrl ?? '')
  const [tags, setTags] = useState(project?.tags.join(', ') ?? '')
  const [featured, setFeatured] = useState(project?.featured ?? false)
  const [visible, setVisible] = useState(project?.visible ?? true)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const body = {
      title,
      description,
      image,
      url: url || null,
      githubUrl: githubUrl || null,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      featured,
      visible,
    }
    const endpoint = project ? `/api/projects/${project.id}` : '/api/projects'
    const method = project ? 'PATCH' : 'POST'
    await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    router.push('/admin/projects')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl flex flex-col gap-5">
      <div>
        <Label>Title</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} required className="mt-1" />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} required className="mt-1" rows={3} />
      </div>
      <div>
        <Label>Project Image</Label>
        <div className="mt-1">
          <ImageUpload value={image} onChange={setImage} label="Upload project image" />
        </div>
      </div>
      <div>
        <Label>Live URL</Label>
        <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" className="mt-1" />
      </div>
      <div>
        <Label>GitHub URL</Label>
        <Input value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/..." className="mt-1" />
      </div>
      <div>
        <Label>Tags (comma-separated)</Label>
        <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="React, Node.js" className="mt-1" />
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={featured} onCheckedChange={setFeatured} id="featured" />
        <Label htmlFor="featured">Featured (purple glow on homepage)</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={visible} onCheckedChange={setVisible} id="visible" />
        <Label htmlFor="visible">Visible on site</Label>
      </div>
      <Button type="submit" disabled={saving} className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 mt-2">
        {saving ? 'Saving…' : project ? 'Save Changes' : 'Create Project'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Create app/admin/projects/new/page.tsx**

```typescript
import { ProjectForm } from '@/components/admin/ProjectForm'

export default function NewProjectPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">New Project</h1>
      <ProjectForm />
    </div>
  )
}
```

- [ ] **Step 3: Create app/admin/projects/[id]/page.tsx**

```typescript
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ProjectForm } from '@/components/admin/ProjectForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Edit Project</h1>
      <ProjectForm project={project} />
    </div>
  )
}
```

- [ ] **Step 4: End-to-end test**

1. Create a project at `/admin/projects/new` — fill in title, description, tags, toggle featured on
2. Verify it appears at `/admin/projects`
3. Verify it appears on the homepage projects grid at `http://localhost:3000`
4. Edit the project — change description and upload an image
5. Verify changes are reflected on the homepage

- [ ] **Step 5: Commit**

```bash
git add components/admin/ProjectForm.tsx app/admin/projects/
git commit -m "feat: add admin project create/edit form"
```

---

### Task 20: Final Polish and Deployment Prep

**Files:**
- Modify: `next.config.ts`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Configure next.config.ts for external images**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 2: Configure tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  plugins: [typography],
}

export default config
```

- [ ] **Step 3: Run full type check**

```bash
npx tsc --noEmit
```

Fix any errors before deploying.

- [ ] **Step 4: Run all unit tests**

```bash
npx jest __tests__/lib/utils.test.ts
```

Expected: PASS (all green)

- [ ] **Step 5: Verify all pages in browser**

Check `http://localhost:3000`:
- `/` — homepage: hero headshot shows, all sections visible
- `/blog` — blog listing renders
- `/admin/login` — login form renders
- `/admin` — dashboard (requires login)
- `/admin/posts` — post table
- `/admin/posts/new` — Tiptap editor
- `/admin/projects` — sortable list
- `/admin/projects/new` — project form

- [ ] **Step 6: Check responsive layout at 390px width**

In browser devtools, set viewport to 390px. Verify:
- Navbar shows hamburger menu
- Hero stacks to single column
- About section stacks
- Projects grid is 1 column
- Tech stack is 3 columns

- [ ] **Step 7: Test dark/light toggle**

Click theme toggle. Verify smooth transition between dark (default) and light modes, all text remains readable.

- [ ] **Step 8: Set Vercel environment variables**

In Vercel dashboard, add:
```
DATABASE_URL         (Neon Postgres connection string)
NEXTAUTH_SECRET      (32-char random string — run: openssl rand -base64 32)
NEXTAUTH_URL         https://example.com
ADMIN_EMAIL          your-email@example.com
ADMIN_PASSWORD       your-strong-password
BLOB_READ_WRITE_TOKEN  (from Vercel Blob settings)
```

- [ ] **Step 9: Deploy**

```bash
git add next.config.ts tailwind.config.ts
git commit -m "chore: configure image domains and typography plugin for production"

git push origin dev
```

Create a PR from `dev` to `main` in GitHub. Merge it. Vercel auto-deploys on merge.

- [ ] **Step 10: Smoke-test production**

Visit `https://example.com`:
- Homepage loads with all sections
- Admin login works at `/admin/login`
- Create a test project via CMS — confirm it appears on the homepage
- Create a test blog post, publish it — confirm it appears at `/blog`
- Images upload to Vercel Blob and display correctly

---

## Spec Coverage Check

| Spec requirement | Task |
|-----------------|------|
| Dark-first + light/dark toggle | Task 5 (ThemeProvider, CSS variables) |
| Hero with headshot + glow ring | Task 10 (HeroSection) |
| About section with stats | Task 10 (AboutSection) |
| Projects grid from DB, featured glow | Task 10 (ProjectsSection) |
| Tech stack logo grid (static) | Task 10 (TechStackSection) |
| Contact with links | Task 10 (ContactSection) |
| Blog listing `/blog` | Task 12 |
| Blog post `/blog/[slug]` with Tiptap HTML | Task 13 |
| Admin login + 30-day session | Tasks 4, 14 |
| Admin dashboard with stats | Task 15 |
| Post list table with publish toggle | Task 16 |
| Post editor — Tiptap, inline image, YouTube, cover, tags, slug | Task 17 |
| Project list with drag-to-reorder | Task 18 |
| Project editor — all fields, featured toggle, visible toggle | Task 19 |
| Prisma + Neon Postgres | Task 2 |
| NextAuth v5 credentials | Task 4 |
| Vercel Blob image upload | Task 9 |
| next-themes theme toggle | Tasks 5, 6 |
| Deployment on Vercel | Task 20 |
| DOMPurify HTML sanitization | Task 13 |
