import Link from 'next/link'
import Image from 'next/image'
import TagChips from './TagChips'
import PostAdminControls from './PostAdminControls'
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
    </div>
  )
}

// The title link's ::after covers the whole (relative) card, so the entire card
// is clickable. Tags sit above it via `relative z-10`, staying independently
// clickable — valid HTML with no nested anchors.
function TitleLink({ slug, title }: { slug: string; title: string }) {
  return (
    <Link
      href={`/blog/${slug}`}
      data-card-link
      className="after:absolute after:inset-0 after:content-[''] focus:outline-none focus-visible:underline"
    >
      {title}
    </Link>
  )
}

export default function PostCard({
  post,
  view = 'grid',
  index = 0,
  isAdmin = false,
}: {
  post: Post
  view?: 'grid' | 'list'
  index?: number
  isAdmin?: boolean
}) {
  const tags = post.tags ?? []
  const hasTags = tags.length > 0
  const adminControls = isAdmin ? (
    <PostAdminControls id={post.id} title={post.title} variant="card" />
  ) : null

  if (view === 'list') {
    const imageRight = index % 2 !== 0
    return (
      <article
        className={`group relative flex flex-col sm:flex-row${
          imageRight ? ' sm:flex-row-reverse' : ''
        } rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] transition-colors overflow-hidden has-[a[data-card-link]:focus-visible]:ring-2 has-[a[data-card-link]:focus-visible]:ring-[var(--accent)] has-[a[data-card-link]:focus-visible]:ring-offset-2 has-[a[data-card-link]:focus-visible]:ring-offset-[var(--background)]`}
      >
        {post.coverImage ? (
          <div className="relative h-48 sm:h-auto sm:min-h-[12rem] sm:w-60 flex-shrink-0">
            <Image src={post.coverImage} alt={post.title} fill className="object-cover" unoptimized />
          </div>
        ) : null}
        <div className="p-5 flex flex-col justify-center flex-1 min-w-0">
          <h2 className="font-semibold text-lg text-[var(--foreground)] mb-2 transition-colors group-hover:text-[var(--accent)]">
            <TitleLink slug={post.slug} title={post.title} />
          </h2>
          {post.excerpt && (
            <p className="text-sm text-[var(--muted)] mb-3 line-clamp-2">{post.excerpt}</p>
          )}
          <Meta post={post} />
          {hasTags && <TagChips tags={tags} className="relative z-10 mt-3" />}
          {adminControls}
        </div>
      </article>
    )
  }

  return (
    <article className="group relative flex h-full flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] transition-colors overflow-hidden has-[a[data-card-link]:focus-visible]:ring-2 has-[a[data-card-link]:focus-visible]:ring-[var(--accent)] has-[a[data-card-link]:focus-visible]:ring-offset-2 has-[a[data-card-link]:focus-visible]:ring-offset-[var(--background)]">
      {post.coverImage && (
        <div className="relative h-44 w-full">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" unoptimized />
        </div>
      )}
      <div className="p-5 flex flex-1 flex-col">
        <h2 className="font-semibold text-lg text-[var(--foreground)] mb-2 transition-colors group-hover:text-[var(--accent)]">
          <TitleLink slug={post.slug} title={post.title} />
        </h2>
        {post.excerpt && (
          <p className="text-sm text-[var(--muted)] mb-3 line-clamp-2">{post.excerpt}</p>
        )}
        <div className="mt-auto pt-2">
          <Meta post={post} />
          {hasTags && <TagChips tags={tags} className="relative z-10 mt-3" />}
          {adminControls}
        </div>
      </div>
    </article>
  )
}
