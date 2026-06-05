'use client'

import { useState } from 'react'
import type { MediaCardData } from '@/lib/media'
import type { Platform } from '@/lib/social'
import MediaCarousel from './MediaCarousel'
import MediaModal, { useOpenMedia, type ModalGroup } from './MediaModal'
import { InstagramIcon, YoutubeIcon } from './icons'

export type ShowcaseRow = {
  id: string
  title?: string
  href?: string
  /** When set, an icon for the platform is shown next to the row title. */
  iconPlatform?: Platform
  items: MediaCardData[]
}

/**
 * Renders a stack of media carousels that all share one player modal. Used by
 * both the landing-page section and the /reels and /videos pages. Must be
 * mounted inside a <Suspense> boundary (the modal reads the URL search params).
 * When `topicNav` is set, a sticky chip bar lets visitors jump between rows.
 */
export default function MediaShowcase({
  rows,
  topicNav = false,
  modalGroups,
}: {
  rows: ShowcaseRow[]
  topicNav?: boolean
  /** Swipe lanes for the player (defaults to the visible rows). Pass an explicit
   *  non-overlapping partition where display rows overlap (e.g. a Featured row). */
  modalGroups?: ModalGroup[]
}) {
  const openMedia = useOpenMedia()
  const visibleRows = rows.filter((r) => r.items.length > 0)
  const groups: ModalGroup[] =
    modalGroups ?? visibleRows.map((r) => ({ id: r.id, title: r.title, items: r.items }))

  return (
    <>
      {topicNav && visibleRows.length > 1 && <TopicNav rows={visibleRows} />}

      <div className="space-y-10">
        {visibleRows.map((row) => (
          <MediaCarousel
            key={row.id}
            id={topicNav ? `row-${row.id}` : undefined}
            title={row.title}
            items={row.items}
            onOpen={openMedia}
            viewAllHref={row.href}
            showCount={topicNav}
            icon={
              row.iconPlatform === 'instagram' ? (
                <InstagramIcon size={18} className="text-[var(--accent)]" />
              ) : row.iconPlatform === 'youtube' ? (
                <YoutubeIcon size={18} className="text-[var(--accent)]" />
              ) : undefined
            }
          />
        ))}
      </div>

      <MediaModal groups={groups} />
    </>
  )
}

function TopicNav({ rows }: { rows: ShowcaseRow[] }) {
  const [active, setActive] = useState(rows[0]?.id)

  function jump(id: string) {
    setActive(id)
    document.getElementById(`row-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="sticky top-14 z-30 -mx-4 mb-8 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur-md">
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => jump(row.id)}
            className={[
              'shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border transition-colors',
              active === row.id
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)]',
            ].join(' ')}
          >
            {row.title}
            <span className={active === row.id ? 'text-white/75' : 'text-[var(--muted)]'}>{row.items.length}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
