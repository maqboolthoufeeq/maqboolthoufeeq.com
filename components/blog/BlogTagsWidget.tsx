import Link from 'next/link'

type Tag = { id: string; name: string; slug: string }

export default function BlogTagsWidget({
  tags,
  activeTag,
}: {
  tags: Tag[]
  activeTag: string
}) {
  if (tags.length === 0) return null

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3 uppercase tracking-wide">Tags</h2>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => {
          const isActive = tag.slug === activeTag
          return (
            <Link
              key={tag.id}
              href={isActive ? '/blog' : `/blog?tag=${tag.slug}`}
              className={[
                'text-xs px-2.5 py-1 rounded-full border transition-colors',
                isActive
                  ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)]',
              ].join(' ')}
            >
              #{tag.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
