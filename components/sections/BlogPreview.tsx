import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { readingTime } from '@/lib/utils'

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

      <ul className="space-y-6">
        {posts.map((post, i) => {
          const imageRight = i % 2 !== 0
          return (
            <li key={post.id}>
              <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] transition-colors overflow-hidden">
                <Link
                  href={`/blog/${post.slug}`}
                  className={`group flex flex-col sm:flex-row${imageRight ? ' sm:flex-row-reverse' : ''}`}
                >
                  {post.coverImage ? (
                    <div className="relative h-48 sm:h-auto sm:w-64 flex-shrink-0">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : null}
                  <div className="p-5 flex flex-col justify-center flex-1">
                    <h3 className="font-semibold text-[var(--foreground)] mb-2 group-hover:text-[var(--accent)] transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-[var(--muted)] mb-3 line-clamp-2">{post.excerpt}</p>
                    )}
                    <div className="flex gap-4 text-xs text-[var(--muted)]">
                      {post.publishedAt && (
                        <span>
                          {new Date(post.publishedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                      <span>{readingTime(post.content)} min read</span>
                    </div>
                  </div>
                </Link>
              </article>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
