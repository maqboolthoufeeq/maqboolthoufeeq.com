import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { readingTime } from '@/lib/utils'

export default async function BlogPreview() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    select: { id: true, title: true, slug: true, excerpt: true, content: true, publishedAt: true },
  })

  if (posts.length === 0) return null

  return (
    <section id="blog" className="max-w-5xl mx-auto px-4 py-20">
      <div className="flex items-end justify-between mb-2">
        <h2 className="text-2xl font-bold text-[var(--foreground)]">Latest posts</h2>
        <Link href="/blog" className="text-sm text-[var(--accent)] hover:underline">
          All posts →
        </Link>
      </div>
      <div className="w-10 h-0.5 bg-[var(--accent)] mb-10" />

      <ul className="space-y-6">
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/blog/${post.slug}`} className="group block">
              <article className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] transition-colors">
                <h3 className="font-semibold text-[var(--foreground)] mb-2 group-hover:text-[var(--accent)] transition-colors">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-[var(--muted)] mb-3 line-clamp-2">{post.excerpt}</p>
                )}
                <div className="flex gap-4 text-xs text-[var(--muted)]">
                  {post.publishedAt && (
                    <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  )}
                  <span>{readingTime(post.content)} min read</span>
                </div>
              </article>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
