import Link from 'next/link'
import { readingTime } from '@/lib/utils'

type Tag = { id: string; name: string; slug: string }

type Post = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  publishedAt: Date | null
  tags?: Tag[]
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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--muted)]">
          {post.publishedAt && (
            <time dateTime={new Date(post.publishedAt).toISOString()}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </time>
          )}
          <span>{readingTime(post.content)} min read</span>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span key={tag.id} className="px-2 py-0.5 rounded-full bg-[var(--background)] border border-[var(--border)] text-[var(--muted)]">
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}
