import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import PostCard from '@/components/blog/PostCard'

export default async function BlogPreview() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    take: 3,
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
  })

  if (posts.length === 0) return null

  return (
    <section id="blog" className="max-w-5xl mx-auto px-4 py-6 sm:py-20">
      <div className="flex items-end justify-between mb-2">
        <h2 className="text-2xl font-bold text-[var(--foreground)]">Latest posts</h2>
        <Link href="/blog" className="text-sm text-[var(--accent)] hover:underline">
          All posts →
        </Link>
      </div>
      <div className="w-10 h-0.5 bg-[var(--accent)] mb-6 sm:mb-10" />

      {/* Same grid-card view as the blog page, so cards stay a consistent size. */}
      <ul className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch">
        {posts.map((post, i) => (
          <li key={post.id} className="h-full">
            <PostCard post={post} view="grid" index={i} />
          </li>
        ))}
      </ul>
    </section>
  )
}
