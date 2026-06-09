import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { HubCrumb } from '@/lib/hub'

/**
 * Breadcrumb navigation for the hub: Hub / Parent / Child, with ChevronRight
 * separators. Wraps on mobile. Links to /hub and /hub/{slug}.
 */
export function HubBreadcrumb({
  crumbs,
  current,
}: {
  crumbs: HubCrumb[]
  current?: string
}) {
  return (
    <nav className="flex items-center flex-wrap gap-1 text-sm mb-6">
      {/* Hub home link */}
      <Link
        href="/hub"
        className="text-[var(--accent)] hover:underline font-medium"
      >
        Hub
      </Link>

      {/* Ancestor chain */}
      {crumbs.map((crumb) => (
        <div key={crumb.slug} className="flex items-center gap-1">
          <ChevronRight size={16} className="text-[var(--muted)]" />
          <Link
            href={`/hub/${crumb.slug}`}
            className="text-[var(--accent)] hover:underline"
          >
            {crumb.title}
          </Link>
        </div>
      ))}

      {/* Current page (not a link) */}
      {current && (
        <div className="flex items-center gap-1">
          <ChevronRight size={16} className="text-[var(--muted)]" />
          <span className="text-[var(--foreground)] font-semibold">{current}</span>
        </div>
      )}
    </nav>
  )
}
