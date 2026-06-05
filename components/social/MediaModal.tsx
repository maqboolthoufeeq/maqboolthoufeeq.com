'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react'
import type { MediaCardData } from '@/lib/media'
import { youTubeEmbedUrl, instagramEmbedUrl, permalinkFor, mediaOrientation } from '@/lib/social'
import { formatRelativeDate } from '@/lib/utils'
import { InstagramIcon, YoutubeIcon } from '@/components/social/icons'

/** A topic/feed lane: vertical swipe moves within it, horizontal between lanes. */
export type ModalGroup = { id: string; title?: string; items: MediaCardData[] }

/**
 * Returns a stable `openMedia(id)` that drives the player via `?media=<id>` —
 * shareable and back-button friendly.
 */
export function useOpenMedia() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  return useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('media', id)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )
}

/**
 * Feed-style player. Vertical (swipe / ↑↓) moves to the next reel/video within
 * the current topic; horizontal (swipe / ←→) jumps between topics. On desktop
 * the video and its description sit side by side; on mobile it's full-screen.
 */
export default function MediaModal({ groups }: { groups: ModalGroup[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mediaId, setMediaId] = useState<string | null>(null)
  const touch = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => setMediaId(searchParams.get('media')), [searchParams])

  const lanes = groups.filter((g) => g.items.length > 0)

  // Locate the current item: (lane index, item index).
  let gi = -1
  let ii = -1
  let selected: MediaCardData | null = null
  if (mediaId) {
    for (let g = 0; g < lanes.length; g++) {
      const idx = lanes[g].items.findIndex((it) => it.id === mediaId)
      if (idx !== -1) {
        gi = g
        ii = idx
        selected = lanes[g].items[idx]
        break
      }
    }
  }

  const setMedia = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('media', id)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('media')
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [router, pathname, searchParams])

  const goItem = useCallback(
    (delta: number) => {
      if (gi < 0) return
      const lane = lanes[gi]
      if (lane.items.length <= 1) return
      const ni = (ii + delta + lane.items.length) % lane.items.length
      setMedia(lane.items[ni].id)
    },
    [gi, ii, lanes, setMedia],
  )

  const goTopic = useCallback(
    (delta: number) => {
      if (gi < 0 || lanes.length <= 1) return
      const ng = (gi + delta + lanes.length) % lanes.length
      // Land on the first item of the new topic.
      setMedia(lanes[ng].items[0].id)
    },
    [gi, lanes, setMedia],
  )

  // Keyboard: Esc close, ↑↓ items, ←→ topics.
  useEffect(() => {
    if (!selected) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowUp') { e.preventDefault(); goItem(-1) }
      else if (e.key === 'ArrowDown') { e.preventDefault(); goItem(1) }
      else if (e.key === 'ArrowLeft') goTopic(-1)
      else if (e.key === 'ArrowRight') goTopic(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, close, goItem, goTopic])

  // Lock body scroll while open.
  useEffect(() => {
    document.body.style.overflow = selected ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selected])

  if (!selected) return null

  const lane = lanes[gi]
  const portrait = mediaOrientation(selected.platform, selected.sourceUrl) === 'portrait'
  const isReel = selected.platform === 'instagram'
  const PlatformIcon = isReel ? InstagramIcon : YoutubeIcon
  const multiItem = lane.items.length > 1
  const multiTopic = lanes.length > 1
  const permalink = permalinkFor(selected.platform, selected.embedId)
  const dateLabel = selected.date ? formatRelativeDate(selected.date) : null

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY }
  }
  function onTouchEnd(e: React.TouchEvent) {
    const s = touch.current
    touch.current = null
    if (!s) return
    const t = e.changedTouches[0]
    const dx = t.clientX - s.x
    const dy = t.clientY - s.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 45) return // a tap, not a swipe
    if (Math.abs(dy) > Math.abs(dx)) goItem(dy < 0 ? 1 : -1) // swipe up → next
    else goTopic(dx < 0 ? 1 : -1) // swipe left → next topic
  }

  const playerIframe = isReel ? (
    <iframe
      key={selected.id}
      src={instagramEmbedUrl(selected.embedId, true)}
      title={selected.title}
      loading="lazy"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
      scrolling="no"
      className="absolute inset-0 h-full w-full"
    />
  ) : (
    <iframe
      key={selected.id}
      src={youTubeEmbedUrl(selected.embedId, { autoplay: true, controls: true })}
      title={selected.title}
      loading="lazy"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
      className="absolute inset-0 h-full w-full"
    />
  )

  const metaLine = (
    <div className="flex flex-wrap items-center gap-2 text-xs text-white/70 md:text-[var(--muted)]">
      <span className="inline-flex items-center gap-1">
        <PlatformIcon size={13} /> {isReel ? 'Reel' : 'Video'}
      </span>
      {lane.title && (
        <>
          <span aria-hidden>·</span>
          <span>{lane.title}</span>
        </>
      )}
      {dateLabel && (
        <>
          <span aria-hidden>·</span>
          <span suppressHydrationWarning>{dateLabel}</span>
        </>
      )}
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/95 md:bg-black/85 md:backdrop-blur-sm flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label={selected.title}
    >
      {/* Close */}
      <button
        onClick={close}
        aria-label="Close"
        className="absolute z-[80] right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X size={20} />
      </button>

      {/* Mobile: top overlay — topics + our title/meta (kept clear of IG's own
          bottom caption to avoid overlap) */}
      <div className="md:hidden absolute top-0 inset-x-0 z-[78] bg-gradient-to-b from-black/85 via-black/45 to-transparent px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-10">
        {multiTopic && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pr-12 pb-2">
            {lanes.map((l, i) => (
              <button
                key={l.id}
                onClick={() => setMedia(l.items[0].id)}
                className={[
                  'shrink-0 h-7 px-3 rounded-full text-[11px] font-medium border transition-colors',
                  i === gi ? 'border-white bg-white text-black' : 'border-white/30 text-white/80',
                ].join(' ')}
              >
                {l.title ?? `Topic ${i + 1}`}
              </button>
            ))}
          </div>
        )}
        <div className="pr-12">
          <h2 className="text-sm font-semibold leading-snug text-white line-clamp-2">{selected.title}</h2>
          <div className="mt-1">{metaLine}</div>
        </div>
      </div>

      {/* Desktop: prev/next topic */}
      {multiTopic && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goTopic(-1) }}
            aria-label="Previous topic"
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-[78] h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goTopic(1) }}
            aria-label="Next topic"
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-[78] h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Content card */}
      <div
        className="relative flex h-full w-full flex-col items-center justify-center md:h-auto md:max-h-[90dvh] md:w-auto md:flex-row md:items-stretch md:overflow-hidden md:rounded-2xl md:bg-[var(--surface)] md:shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Player */}
        <div
          className={[
            'relative shrink-0 bg-black',
            portrait
              ? 'w-[min(100vw,calc(82dvh*9/16))] aspect-[9/16] md:aspect-auto md:h-[86dvh] md:w-[calc(86dvh*9/16)]'
              : 'w-full aspect-video md:h-auto md:w-[min(64vw,900px)] md:self-center',
          ].join(' ')}
        >
          {playerIframe}

          {/* Mobile: item up/down nav */}
          {multiItem && (
            <div className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 z-[76] flex flex-col gap-2">
              <button onClick={() => goItem(-1)} aria-label="Previous" className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm">
                <ChevronUp size={18} />
              </button>
              <button onClick={() => goItem(1)} aria-label="Next" className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm">
                <ChevronDown size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Desktop: side panel */}
        <div className="hidden md:flex md:w-80 lg:w-96 md:flex-col md:max-h-[90dvh] bg-[var(--surface)]">
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-lg font-bold leading-snug text-[var(--foreground)]">{selected.title}</h2>
            <div className="mt-2">{metaLine}</div>
            {selected.description && (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[var(--muted)]">{selected.description}</p>
            )}
          </div>
          <div className="shrink-0 border-t border-[var(--border)] p-4 flex items-center justify-between gap-3">
            {multiItem ? (
              <div className="flex items-center gap-1">
                <button onClick={() => goItem(-1)} aria-label="Previous" title="Previous (↑)" className="tap-scale flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]">
                  <ChevronUp size={18} />
                </button>
                <button onClick={() => goItem(1)} aria-label="Next" title="Next (↓)" className="tap-scale flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]">
                  <ChevronDown size={18} />
                </button>
                <span className="ml-1 text-xs text-[var(--muted)] tabular-nums">{ii + 1} / {lane.items.length}</span>
              </div>
            ) : (
              <span />
            )}
            <a
              href={permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
            >
              <ExternalLink size={14} /> Open on {isReel ? 'Instagram' : 'YouTube'}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
