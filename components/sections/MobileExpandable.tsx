'use client'

import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * On mobile, clamps its children to a short teaser with a "Show more / Show
 * less" toggle; on `sm`+ screens it always renders fully with no button. The
 * open/closed choice is remembered per `storageKey` in localStorage, so a
 * visitor's preference sticks across visits and across sections.
 *
 * Server-rendered collapsed (matching the first client paint) to avoid any
 * hydration flash; the stored preference is applied right after mount.
 */
export default function MobileExpandable({
  storageKey,
  children,
  collapsedClass = 'max-h-24',
  moreLabel = 'Show more',
  lessLabel = 'Show less',
  label,
}: {
  storageKey: string
  children: React.ReactNode
  /** Tailwind max-height class used for the collapsed teaser on mobile. */
  collapsedClass?: string
  moreLabel?: string
  lessLabel?: string
  /** Accessible name for the toggle, e.g. "About me" — so screen readers
   *  announce which section is expanding, not just "Show more". */
  label?: string
}) {
  const key = `mobile-expand:${storageKey}`
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(key) === '1') setExpanded(true)
    } catch {
      /* private mode / storage disabled — fall back to collapsed */
    }
  }, [key])

  function toggle() {
    setExpanded((prev) => {
      const next = !prev
      try {
        localStorage.setItem(key, next ? '1' : '0')
      } catch {
        /* ignore write failures */
      }
      return next
    })
  }

  return (
    <div>
      <div
        className={[
          'relative sm:max-h-none sm:overflow-visible',
          expanded ? '' : `${collapsedClass} overflow-hidden`,
        ].join(' ')}
      >
        {children}
        {/* Fade hint that there's more, mobile + collapsed only. */}
        {!expanded && (
          <div className="sm:hidden pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[var(--background)] to-transparent" />
        )}
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        aria-label={label ? `${expanded ? lessLabel : moreLabel} — ${label}` : undefined}
        className="tap-scale sm:hidden mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
      >
        {expanded ? lessLabel : moreLabel}
        <ChevronDown
          size={16}
          className="transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
        />
      </button>
    </div>
  )
}
