import Link from 'next/link'
import type { AdjacentPost } from '@/lib/related-posts'

export default function PostNavigation({
  previous,
  next,
}: {
  previous: AdjacentPost | null
  next: AdjacentPost | null
}) {
  if (!previous && !next) return null

  return (
    <nav
      aria-label="Blog post navigation"
      className="mt-12 pt-8 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      {previous ? (
        <Link
          href={`/blog/${previous.slug}`}
          className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] transition-colors p-5"
        >
          <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] mb-2">
            <span aria-hidden>←</span> Previous post
          </span>
          <span className="block font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
            {previous.title}
          </span>
        </Link>
      ) : (
        <span aria-hidden className="hidden sm:block" />
      )}

      {next ? (
        <Link
          href={`/blog/${next.slug}`}
          className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] transition-colors p-5 sm:text-right"
        >
          <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] mb-2 sm:justify-end">
            Next post <span aria-hidden>→</span>
          </span>
          <span className="block font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
            {next.title}
          </span>
        </Link>
      ) : (
        <span aria-hidden className="hidden sm:block" />
      )}
    </nav>
  )
}
