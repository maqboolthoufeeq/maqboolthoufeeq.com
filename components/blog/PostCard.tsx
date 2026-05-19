import Link from 'next/link'
import { readingTime } from '@/lib/utils'

type Post = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  publishedAt: Date | null
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <article className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] transition-colors">
      <Link href={`/blog/${post.slug}`} className="group block">
        <h2 className="font-semibold text-lg text-[var(--foreground)] mb-2 group-hover:text-[var(--accent)] transition-colors">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-sm text-[var(--muted)] mb-4 line-clamp-3">{post.excerpt}</p>
        )}
        <div className="flex gap-4 text-xs text-[var(--muted)]">
          {post.publishedAt && (
            <time dateTime={post.publishedAt.toISOString()}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </time>
          )}
          <span>{readingTime(post.content)} min read</span>
        </div>
      </Link>
    </article>
  )
}
