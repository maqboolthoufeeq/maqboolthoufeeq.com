import Navbar from '@/components/Navbar'
import BlogSearch from '@/components/blog/BlogSearch'
import BlogListClient from '@/components/blog/BlogListClient'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Blog — Maqbool Thoufeeq',
  description: 'Articles about web development, TypeScript, and engineering.',
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

  const [posts, total, tags] = await Promise.all([
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
  ])

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Blog</h1>
        <div className="w-10 h-0.5 bg-[var(--accent)] mb-10" />

        <BlogSearch tags={tags} initialQ={q} initialTag={tag} />

        <BlogListClient
          initialPosts={posts}
          initialHasMore={total > PAGE_SIZE}
          q={q}
          tag={tag}
        />
      </main>
    </>
  )
}
