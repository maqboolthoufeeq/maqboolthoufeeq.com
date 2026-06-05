'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { MediaCardData } from '@/lib/media'
import MediaCard from './MediaCard'

/**
 * A horizontally scrollable row of media cards with snap scrolling and
 * desktop arrow controls. Touch users swipe; the scrollbar is hidden.
 */
export default function MediaCarousel({
  title,
  items,
  onOpen,
  viewAllHref,
  icon,
  id,
  showCount = false,
}: {
  title?: string
  items: MediaCardData[]
  onOpen: (id: string) => void
  viewAllHref?: string
  icon?: React.ReactNode
  /** Anchor id for in-page topic navigation. */
  id?: string
  /** Show an item count next to the title. */
  showCount?: boolean
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const update = useCallback(() => {
    const el = scroller.current
    if (!el) return
    setAtStart(el.scrollLeft <= 8)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8)
  }, [])

  useEffect(() => {
    update()
    const el = scroller.current
    if (!el) return
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update, items.length])

  function scrollBy(dir: -1 | 1) {
    const el = scroller.current
    if (!el) return
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 240), behavior: 'smooth' })
  }

  if (items.length === 0) return null

  return (
    <div id={id} className="group/carousel scroll-mt-20">
      {(title || viewAllHref) && (
        <div className="flex items-end justify-between gap-3 mb-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--foreground)]">
            {icon}
            {title}
            {showCount && (
              <span className="text-sm font-medium text-[var(--muted)]">{items.length}</span>
            )}
          </h3>
          <div className="flex items-center gap-2">
            {viewAllHref && (
              <Link
                href={viewAllHref}
                className="text-sm font-medium text-[var(--accent)] hover:underline whitespace-nowrap"
              >
                View all →
              </Link>
            )}
            {/* Desktop arrows */}
            <div className="hidden sm:flex items-center gap-1">
              <ArrowButton dir="left" disabled={atStart} onClick={() => scrollBy(-1)} />
              <ArrowButton dir="right" disabled={atEnd} onClick={() => scrollBy(1)} />
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <div
          ref={scroller}
          onScroll={update}
          className="flex items-start gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-2"
        >
          {items.map((item) => (
            <MediaCard key={item.id} item={item} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ArrowButton({
  dir,
  disabled,
  onClick,
}: {
  dir: 'left' | 'right'
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'left' ? 'Scroll left' : 'Scroll right'}
      className="tap-scale flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-30 disabled:cursor-default"
    >
      {dir === 'left' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  )
}
