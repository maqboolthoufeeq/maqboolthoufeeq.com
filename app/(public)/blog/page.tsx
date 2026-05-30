import Link from 'next/link'
import { Plus } from 'lucide-react'
import Navbar from '@/components/Navbar'
import BlogSearch from '@/components/blog/BlogSearch'
import BlogListClient from '@/components/blog/BlogListClient'
import BlogArchive from '@/components/blog/BlogArchive'
import BlogTagsWidget from '@/components/blog/BlogTagsWidget'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getSiteContent } from '@/lib/site-content'
import { getRequestOrigin } from '@/lib/request-origin'
import { SITE_NAME, buildPageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const origin = await getRequestOrigin()
  return buildPageMetadata({
    origin,
    title: `Blog — ${SITE_NAME}`,
    description: 'Articles about web development, TypeScript, and engineering.',
    path: '/blog',
    ogTitle: 'Blog',
  })
}

const PAGE_SIZE = 6

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>
}) {
  const { q = '', tag = '' } = await searchParams

  const where = {
    published: true,
    ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {}),
    ...(tag ? { tags: { some: { slug: tag } } } : {}),
  }

  const [posts, total, tags, archivePosts, sections, session] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        publishedAt: true,
        coverImage: true,
        tags: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.post.count({ where }),
    prisma.tag.findMany({
      where: { posts: { some: { published: true } } },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
    prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      select: { slug: true, title: true, publishedAt: true },
    }),
    getSiteContent('sections'),
    auth(),
  ])
  const isAdmin = !!session

  const archiveData = archivePosts
    .filter((p) => p.publishedAt !== null)
    .map((p) => ({ slug: p.slug, title: p.title, publishedAt: (p.publishedAt as Date).toISOString() }))

  const showArchive = sections.blogArchive && archiveData.length > 0
  const showSidebar = showArchive || tags.length > 0

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Blog</h1>
          {isAdmin && (
            <Link
              href="/admin/posts/new"
              className="tap-scale inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus size={18} strokeWidth={2.4} />
              <span className="hidden sm:inline">Create Post</span>
            </Link>
          )}
        </div>
        <div className="w-10 h-0.5 bg-[var(--accent)] mb-10" />

        <div className={showSidebar ? 'flex gap-8 items-start' : undefined}>
          <div className="flex-1 min-w-0">
            <BlogSearch tags={tags} initialQ={q} initialTag={tag} />
            <BlogListClient
              initialPosts={posts}
              initialHasMore={total > PAGE_SIZE}
              q={q}
              tag={tag}
              isAdmin={isAdmin}
            />
          </div>

          {showSidebar && (
            <aside className="w-56 flex-shrink-0 sticky top-6 hidden lg:flex lg:flex-col lg:gap-4">
              {showArchive && <BlogArchive posts={archiveData} />}
              {tags.length > 0 && <BlogTagsWidget tags={tags} activeTag={tag} />}
            </aside>
          )}
        </div>
      </main>
    </>
  )
}
