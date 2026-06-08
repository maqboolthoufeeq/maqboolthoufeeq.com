'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ExternalLink, Play, Info } from 'lucide-react'
import type { MediaCardData } from '@/lib/media'
import {
  youTubeEmbedUrl, instagramEmbedUrl, permalinkFor, mediaOrientation, resolveThumbnail, youTubeThumbnail,
} from '@/lib/social'
import { formatRelativeDate } from '@/lib/utils'
import { InstagramIcon, YoutubeIcon } from '@/components/social/icons'
import MediaExtras from '@/components/social/MediaExtras'

/** A topic/feed lane: vertical swipe moves within it, horizontal between lanes. */
export type ModalGroup = { id: string; title?: string; items: MediaCardData[] }

/** Returns a stable `openMedia(id)` driving the player via `?media=<id>`. */
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

function isDesktopNow() {
  return typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
}

/**
 * Feed-style player. On mobile it's a swipeable feed: swipe up/down (or ↑↓) for
 * the next reel/video in the topic, swipe left/right (or ←→) to change topic; a
 * poster covers the video so swipes register (cross-origin embeds eat touches),
 * and tapping plays it. On desktop the video and its description sit side by side.
 */
export default function MediaModal({ groups }: { groups: ModalGroup[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mediaId, setMediaId] = useState<string | null>(null)
  const [desktop, setDesktop] = useState(isDesktopNow)
  const [playing, setPlaying] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const touch = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => setMediaId(searchParams.get('media')), [searchParams])
  useEffect(() => {
    setPlaying(false) // a new item starts as a poster
    setDetailsOpen(false) // …and with its details sheet closed
  }, [mediaId])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const on = () => setDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const lanes = groups.filter((g) => g.items.length > 0)

  let gi = -1
  let ii = -1
  let selected: MediaCardData | null = null
  if (mediaId) {
    for (let g = 0; g < lanes.length; g++) {
      const idx = lanes[g].items.findIndex((it) => it.id === mediaId)
      if (idx !== -1) { gi = g; ii = idx; selected = lanes[g].items[idx]; break }
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
      setMedia(lanes[ng].items[0].id) // land on the new topic's first item
    },
    [gi, lanes, setMedia],
  )

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
  const poster = resolveThumbnail(selected.platform, selected.embedId, selected.thumbnailUrl, 'maxres')
  const posterFallback = selected.platform === 'youtube' ? youTubeThumbnail(selected.embedId, 'hq') : null
  const showIframe = desktop || playing
  const hasExtras = selected.links.length > 0 || selected.attachments.length > 0
  const extrasCount = selected.links.length + selected.attachments.length
  const hasDetails = hasExtras || !!selected.description

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
    const adx = Math.abs(dx)
    const ady = Math.abs(dy)
    if (Math.max(adx, ady) < 40) return // tap, not a swipe
    if (ady >= adx) goItem(dy < 0 ? 1 : -1) // swipe up → next item
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
      <span className="inline-flex items-center gap-1"><PlatformIcon size={13} /> {isReel ? 'Reel' : 'Video'}</span>
      {lane.title && (<><span aria-hidden>·</span><span>{lane.title}</span></>)}
      {dateLabel && (<><span aria-hidden>·</span><span suppressHydrationWarning>{dateLabel}</span></>)}
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

      {/* Desktop: prev/next topic */}
      {multiTopic && (
        <>
          <button onClick={(e) => { e.stopPropagation(); goTopic(-1) }} aria-label="Previous topic" className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-[78] h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <ChevronLeft size={24} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); goTopic(1) }} aria-label="Next topic" className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-[78] h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
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
            'relative shrink-0 bg-black overflow-hidden',
            portrait
              ? 'w-[min(100vw,calc(82dvh*9/16))] aspect-[9/16] md:aspect-auto md:h-[86dvh] md:w-[calc(86dvh*9/16)]'
              : 'w-full aspect-video md:h-auto md:w-[min(64vw,900px)] md:self-center',
          ].join(' ')}
        >
          {/* Poster (behind, and the tappable swipe surface on mobile) */}
          {poster ? (
            <img
              src={poster}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => { if (posterFallback) (e.currentTarget as HTMLImageElement).src = posterFallback }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--accent)]/30 via-black to-black">
              <PlatformIcon size={56} className="text-white/40" />
            </div>
          )}

          {showIframe && <div className="absolute inset-0">{playerIframe}</div>}

          {/* Mobile poster mode: tap to play (this layer also lets swipes register) */}
          {!showIframe && (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Play ${selected.title}`}
              className="md:hidden absolute inset-0 z-[5] flex items-center justify-center"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
                <Play size={28} className="ml-1 fill-current" />
              </span>
            </button>
          )}

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

          {/* Mobile: top overlay — topics + title (kept clear of IG's bottom caption).
              Captures swipes (bubbling to the backdrop) so navigation works even while playing. */}
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

        </div>

        {/* Desktop: side panel */}
        <div className="hidden md:flex md:w-80 lg:w-96 md:flex-col md:max-h-[90dvh] bg-[var(--surface)]">
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-lg font-bold leading-snug text-[var(--foreground)]">{selected.title}</h2>
            <div className="mt-2">{metaLine}</div>
            {selected.description && (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[var(--muted)]">{selected.description}</p>
            )}
            {hasExtras && (
              <div className="mt-5">
                <MediaExtras links={selected.links} attachments={selected.attachments} />
              </div>
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
            <a href={permalink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline">
              <ExternalLink size={14} /> Open on {isReel ? 'Instagram' : 'YouTube'}
            </a>
          </div>
        </div>
      </div>

      {/* Mobile: bottom action bar — open on platform + a Details sheet (description, links, files).
          The gradient ignores pointer events so swipes still register; only the buttons are tappable. */}
      <div className="md:hidden absolute inset-x-0 bottom-0 z-[82] px-3 pt-10 pb-[max(0.6rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/90 via-black/45 to-transparent pointer-events-none">
        {!showIframe && (multiItem || multiTopic) && (
          <p className="mb-2 text-center text-[11px] text-white/60">
            {multiItem ? 'Swipe up/down for more' : ''}
            {multiItem && multiTopic ? ' · ' : ''}
            {multiTopic ? 'left/right for topics' : ''}
          </p>
        )}
        <div className="flex items-center justify-center gap-2 pointer-events-auto">
          <a
            href={permalink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="tap-scale inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-white/15 text-white text-sm font-medium backdrop-blur-sm hover:bg-white/25 transition-colors"
          >
            <ExternalLink size={15} /> {isReel ? 'Instagram' : 'YouTube'}
          </a>
          {hasDetails && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setDetailsOpen(true) }}
              className="tap-scale inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-white/15 text-white text-sm font-medium backdrop-blur-sm hover:bg-white/25 transition-colors"
            >
              <Info size={15} /> Details
              {extrasCount > 0 && (
                <span className="ml-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-[11px] font-semibold text-white">
                  {extrasCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile: details bottom sheet */}
      {detailsOpen && (
        <div
          className="md:hidden fixed inset-0 z-[88] flex items-end"
          onClick={() => setDetailsOpen(false)}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-[var(--surface)] px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-[var(--border)]" />
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-bold leading-snug text-[var(--foreground)] line-clamp-2">{selected.title}</h2>
              <button
                onClick={() => setDetailsOpen(false)}
                aria-label="Close details"
                className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
              <span className="inline-flex items-center gap-1"><PlatformIcon size={13} /> {isReel ? 'Reel' : 'Video'}</span>
              {lane.title && (<><span aria-hidden>·</span><span>{lane.title}</span></>)}
              {dateLabel && (<><span aria-hidden>·</span><span suppressHydrationWarning>{dateLabel}</span></>)}
            </div>
            {selected.description && (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--muted)]">{selected.description}</p>
            )}
            {hasExtras && (
              <div className="mt-5">
                <MediaExtras links={selected.links} attachments={selected.attachments} />
              </div>
            )}
            <a
              href={permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
            >
              <ExternalLink size={14} /> Open on {isReel ? 'Instagram' : 'YouTube'}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
