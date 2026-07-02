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

  // Compact, fixed-size grid card: every part has a reserved size so all cards
  // are identical regardless of content length (fixed cover, 2-line title, 2-line
  // excerpt on sm+, single-row tags). The whole card links to the post — that's
  // the "read more". `max-sm:hidden` (not `sm:block`) hides the excerpt on the
  // 2-col mobile view *without* overriding line-clamp's display, so it actually
  // clamps to 2 lines on larger screens instead of running full length.
  return (
    <article className="group relative flex h-full flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] active:scale-[0.98] transition overflow-hidden has-[a[data-card-link]:focus-visible]:ring-2 has-[a[data-card-link]:focus-visible]:ring-[var(--accent)] has-[a[data-card-link]:focus-visible]:ring-offset-2 has-[a[data-card-link]:focus-visible]:ring-offset-[var(--background)]">
      <div className="relative h-32 sm:h-40 w-full shrink-0 bg-[var(--background)]">
        {post.coverImage ? (
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--accent)]/15 to-[var(--surface)]">
            <span className="text-3xl text-[var(--accent)]/50" style={{ fontFamily: 'var(--font-lora), serif' }}>
              {post.title.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h2 className="font-semibold text-base sm:text-lg text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)] line-clamp-2 min-h-[3rem] sm:min-h-[3.5rem]">
          <TitleLink slug={post.slug} title={post.title} />
        </h2>
        <p className="max-sm:hidden mt-2 text-sm text-[var(--muted)] leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {post.excerpt}
        </p>
        <div className="mt-auto pt-3">
          <Meta post={post} />
          {hasTags && (
            <TagChips tags={tags} className="relative z-10 mt-2.5 max-h-[1.625rem] overflow-hidden" />
          )}
          {adminControls}
        </div>
      </div>
    </article>
  )
}
