import Navbar from '@/components/Navbar'
import PostCard from '@/components/blog/PostCard'
import BlogSearch from '@/components/blog/BlogSearch'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Blog — Maqbool Thoufeeq',
  description: 'Articles about web development, TypeScript, and engineering.',
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ q?: string; tag?: string }> }) {
  const { q = '', tag = '' } = await searchParams

  const [posts, tags] = await Promise.all([
    prisma.post.findMany({
      where: {
        published: true,
        ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
        ...(tag ? { tags: { some: { slug: tag } } } : {}),
      },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true, title: true, slug: true, excerpt: true, content: true, publishedAt: true,
        tags: { select: { id: true, name: true, slug: true } },
      },
    }),
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

        {posts.length === 0 ? (
          <p className="text-[var(--muted)]">{q || tag ? 'No posts match your search.' : 'No posts yet. Check back soon.'}</p>
        ) : (
          <ul className="space-y-6">
            {posts.map((post) => (
              <li key={post.id}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
