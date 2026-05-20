import Link from 'next/link'
import Image from 'next/image'
import { readingTime } from '@/lib/utils'

type Tag = { id: string; name: string; slug: string }

type Post = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  publishedAt: Date | string | null
  coverImage?: string | null
  tags?: Tag[]
}

function Meta({ post }: { post: Post }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--muted)]">
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
            <span
              key={tag.id}
              className="px-2 py-0.5 rounded-full bg-[var(--background)] border border-[var(--border)] text-[var(--muted)]"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PostCard({
  post,
  view = 'grid',
  index = 0,
}: {
  post: Post
  view?: 'grid' | 'list'
  index?: number
}) {
  if (view === 'list') {
    const imageRight = index % 2 !== 0
    return (
      <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] transition-colors overflow-hidden">
        <Link
          href={`/blog/${post.slug}`}
          className={`group flex flex-col sm:flex-row${imageRight ? ' sm:flex-row-reverse' : ''}`}
        >
          {post.coverImage ? (
            <div className="relative h-48 sm:h-auto sm:w-60 flex-shrink-0">
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
            <h2 className="font-semibold text-lg text-[var(--foreground)] mb-2 group-hover:text-[var(--accent)] transition-colors">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="text-sm text-[var(--muted)] mb-3 line-clamp-2">{post.excerpt}</p>
            )}
            <Meta post={post} />
          </div>
        </Link>
      </article>
    )
  }

  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] transition-colors overflow-hidden">
      <Link href={`/blog/${post.slug}`} className="group block">
        {post.coverImage && (
          <div className="relative h-44 w-full">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="p-5">
          <h2 className="font-semibold text-lg text-[var(--foreground)] mb-2 group-hover:text-[var(--accent)] transition-colors">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-sm text-[var(--muted)] mb-3 line-clamp-2">{post.excerpt}</p>
          )}
          <Meta post={post} />
        </div>
      </Link>
    </article>
  )
}
