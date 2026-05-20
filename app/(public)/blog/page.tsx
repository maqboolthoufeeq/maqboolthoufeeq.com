import Navbar from '@/components/Navbar'
import PostCard from '@/components/blog/PostCard'
import { prisma } from '@/lib/prisma'
type PostPreview = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  publishedAt: Date | null
  tags: { id: string; name: string; slug: string }[]
}

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Blog — Maqbool Thoufeeq',
  description: 'Articles about web development, TypeScript, and engineering.',
}

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true, title: true, slug: true, excerpt: true, content: true, publishedAt: true,
      tags: { select: { id: true, name: true, slug: true } },
    },
  })

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Blog</h1>
        <div className="w-10 h-0.5 bg-[var(--accent)] mb-10" />

        {posts.length === 0 ? (
          <p className="text-[var(--muted)]">No posts yet. Check back soon.</p>
        ) : (
          <ul className="space-y-6">
            {posts.map((post: PostPreview) => (
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
