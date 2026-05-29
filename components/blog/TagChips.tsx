import Link from 'next/link'

type Tag = { id: string; name: string; slug: string }

/**
 * Clickable tag chips. Each links to the blog list filtered by that tag,
 * so tapping a tag anywhere lists every post that shares it.
 */
export default function TagChips({
  tags,
  size = 'sm',
  className = '',
}: {
  tags: Tag[]
  size?: 'sm' | 'md'
  className?: string
}) {
  if (!tags || tags.length === 0) return null

  const sizing = size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-xs'

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={`/blog?tag=${tag.slug}`}
          className={`${sizing} rounded-full bg-[var(--background)] border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] transition-colors`}
        >
          #{tag.name}
        </Link>
      ))}
    </div>
  )
}
