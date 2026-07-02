'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ExternalLink, Play, Info, Volume2 } from 'lucide-react'
import type { MediaCardData } from '@/lib/media'
import {
  youTubeEmbedUrl, instagramEmbedUrl, permalinkFor, mediaOrientation, resolveThumbnail, youTubeThumbnail,
} from '@/lib/social'
import { formatRelativeDate } from '@/lib/utils'
import { InstagramIcon, YoutubeIcon } from '@/components/social/icons'
import MediaExtras from '@/components/social/MediaExtras'

/** A topic/feed lane: vertical scroll moves within it, horizontal between lanes. */
export type ModalGroup = { id: string; title?: string; items: MediaCardData[] }

const OPEN_EVENT = 'media:open'

/**
 * Returns a stable `openMedia(id)` that opens the player *instantly* via a
 * client-side event (no `router.push`, so no RSC round-trip on the
 * force-dynamic page — that round-trip is what made opening/next feel slow).
 * The active item is mirrored to a shareable `?media=<id>` URL with the History
 * API, and the back button closes the player.
 */
export function useOpenMedia() {
  return useCallback((id: string) => {
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }))
  }, [])
}

function posterFor(it: MediaCardData): string | null {
  return resolveThumbnail(it.platform, it.embedId, it.thumbnailUrl, 'maxres')
}

function isDesktopNow() {
  return typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
}

export default function MediaModal({ groups }: { groups: ModalGroup[] }) {
  const [mediaId, setMediaId] = useState<string | null>(null)
  const [desktop, setDesktop] = useState(isDesktopNow)

  const lanes = useMemo(() => groups.filter((g) => g.items.length > 0), [groups])

  // Locate the active item + its lane.
  let gi = -1, ii = -1
  let selected: MediaCardData | null = null
  if (mediaId) {
    for (let g = 0; g < lanes.length; g++) {
      const idx = lanes[g].items.findIndex((it) => it.id === mediaId)
      if (idx !== -1) { gi = g; ii = idx; selected = lanes[g].items[idx]; break }
    }
  }

  // Keep `?media=<id>` in sync WITHOUT a Next navigation (instant + shareable).
  // `push` on open (so Back closes), `replace` for in-feed moves (no stack bloat).
  const syncUrl = useCallback((id: string | null, push = false) => {
    const url = new URL(window.location.href)
    if (id) url.searchParams.set('media', id)
    else url.searchParams.delete('media')
    const next = `${url.pathname}${url.search}${url.hash}`
    const state = { mediaOpen: !!id }
    if (push) window.history.pushState(state, '', next)
    else window.history.replaceState(state, '', next)
  }, [])

  // Deep-link on mount + browser back/forward (reads the live URL).
  useEffect(() => {
    const read = () => setMediaId(new URLSearchParams(window.location.search).get('media'))
    read()
    window.addEventListener('popstate', read)
    return () => window.removeEventListener('popstate', read)
  }, [])

  // Instant open from a card via useOpenMedia().
  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      setMediaId(id)
      syncUrl(id, true)
    }
    window.addEventListener(OPEN_EVENT, onOpen as EventListener)
    return () => window.removeEventListener(OPEN_EVENT, onOpen as EventListener)
  }, [syncUrl])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const on = () => setDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // If the date filter (or any change) removes the open item from the lanes,
  // close cleanly instead of showing a stale/empty player.
  useEffect(() => {
    if (mediaId && !lanes.some((l) => l.items.some((it) => it.id === mediaId))) {
      setMediaId(null)
      syncUrl(null)
    }
  }, [mediaId, lanes, syncUrl])

  const close = useCallback(() => {
    setMediaId(null)
    syncUrl(null, true)
  }, [syncUrl])

  // Set the active item without scrolling (used by desktop nav + the feed's
  // own scroll reporting). Guarded against a missing selection.
  const setActive = useCallback((id: string) => {
    setMediaId(id)
    syncUrl(id)
  }, [syncUrl])

  const goItem = useCallback((delta: number) => {
    if (gi < 0) return
    const lane = lanes[gi]
    if (lane.items.length <= 1) return
    const ni = (ii + delta + lane.items.length) % lane.items.length
    setActive(lane.items[ni].id)
  }, [gi, ii, lanes, setActive])

  const goTopic = useCallback((delta: number) => {
    if (gi < 0 || lanes.length <= 1) return
    const ng = (gi + delta + lanes.length) % lanes.length
    setActive(lanes[ng].items[0].id)
  }, [gi, lanes, setActive])

  // Desktop keyboard nav (mobile uses touch scroll).
  useEffect(() => {
    if (!selected || !desktop) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowUp') { e.preventDefault(); goItem(-1) }
      else if (e.key === 'ArrowDown') { e.preventDefault(); goItem(1) }
      else if (e.key === 'ArrowLeft') goTopic(-1)
      else if (e.key === 'ArrowRight') goTopic(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, desktop, close, goItem, goTopic])

  useEffect(() => {
    document.body.style.overflow = selected ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selected])

  if (!selected) return null
  const lane = lanes[gi]

  return desktop ? (
    <DesktopPlayer
      selected={selected}
      lane={lane}
      ii={ii}
      multiTopic={lanes.length > 1}
      goItem={goItem}
      goTopic={goTopic}
      close={close}
    />
  ) : (
    <MobileFeed
      key={lane.id}
      lanes={lanes}
      gi={gi}
      items={lane.items}
      laneTitle={lane.title}
      initialId={mediaId}
      onActive={setActive}
      onJumpTopic={(id) => setActive(id)}
      close={close}
    />
  )
}

/* ─────────────────────────── Mobile: Instagram-style scroll feed ─────────── */

function MobileFeed({
  lanes, gi, items, laneTitle, initialId, onActive, onJumpTopic, close,
}: {
  lanes: ModalGroup[]
  gi: number
  items: MediaCardData[]
  laneTitle?: string
  initialId: string | null
  onActive: (id: string) => void
  onJumpTopic: (id: string) => void
  close: () => void
}) {
  const feedRef = useRef<HTMLDivElement>(null)
  // Refs keyed by item.id (not render index), so a reorder/filter can't leave
  // the observer pointed at the wrong element.
  const pageEls = useRef<Map<string, HTMLElement>>(new Map())
  const ioRef = useRef<IntersectionObserver | null>(null)
  const [activeId, setActiveId] = useState<string | null>(initialId ?? items[0]?.id ?? null)
  const [soundId, setSoundId] = useState<string | null>(null)
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [idle, setIdle] = useState(true)
  const multiTopic = lanes.length > 1
  const activeIdx = Math.max(0, items.findIndex((it) => it.id === activeId))

  const setPageRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      pageEls.current.set(id, el)
      ioRef.current?.observe(el)
    } else {
      const prev = pageEls.current.get(id)
      if (prev) ioRef.current?.unobserve(prev)
      pageEls.current.delete(id)
    }
  }, [])

  // Only bring a reel "alive" (mount its muted preview iframe) once scrolling
  // settles — during a flick we show posters only, so the scroll stays smooth.
  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    let t: number | undefined
    const onScroll = () => {
      setIdle(false)
      if (t) window.clearTimeout(t)
      t = window.setTimeout(() => setIdle(true), 150)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => { el.removeEventListener('scroll', onScroll); if (t) window.clearTimeout(t) }
  }, [])

  // Land on the requested item the moment the feed mounts (instant, no smooth).
  useEffect(() => {
    pageEls.current.get(initialId ?? items[0]?.id ?? '')?.scrollIntoView({ block: 'start' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The page crossing the vertical centre is "active". The callback stores the
  // element's item id directly (no items-array lookup → no stale closure), so
  // the observer is created once and never needs re-creating on re-render.
  useEffect(() => {
    const root = feedRef.current
    if (!root) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const id = (e.target as HTMLElement).dataset.id
            if (id) setActiveId(id)
          }
        }
      },
      { root, rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    )
    ioRef.current = io
    pageEls.current.forEach((el) => io.observe(el))
    return () => { io.disconnect(); ioRef.current = null }
  }, [])

  // Report the active item up for URL sync; a new reel starts muted (sound off).
  // The details sheet fully covers the feed, so scrolling can't happen while it's
  // open — no need to force-close it here.
  useEffect(() => {
    if (activeId) onActive(activeId)
    setSoundId(null)
  }, [activeId, onActive])

  const scrollToIndex = useCallback((idx: number) => {
    const target = items[Math.max(0, Math.min(items.length - 1, idx))]
    if (target) pageEls.current.get(target.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [items])

  const detailsItem = detailsId ? items.find((it) => it.id === detailsId) : undefined

  return (
    <div className="fixed inset-0 z-[70] bg-black" role="dialog" aria-modal="true" aria-label={items[activeIdx]?.title}>
      {/* Top: close + topic chips */}
      <div className="absolute inset-x-0 top-0 z-[80] px-3 pt-[max(0.6rem,env(safe-area-inset-top))] pb-8 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        <div className="flex items-start gap-2">
          {multiTopic && (
            <div className="flex flex-1 gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto">
              {lanes.map((l, i) => (
                <button
                  key={l.id}
                  onClick={() => onJumpTopic(l.items[0].id)}
                  className={[
                    'shrink-0 h-7 px-3 rounded-full text-[11px] font-medium border transition-colors',
                    i === gi ? 'border-white bg-white text-black' : 'border-white/30 text-white/85 bg-black/20',
                  ].join(' ')}
                >
                  {l.title ?? `Topic ${i + 1}`}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={close}
            aria-label="Close"
            className="pointer-events-auto ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* The scroll-snap feed */}
      <div
        ref={feedRef}
        className="h-[100dvh] overflow-y-scroll snap-y snap-mandatory overscroll-y-contain no-scrollbar [-webkit-overflow-scrolling:touch]"
      >
        {items.map((item) => (
          <ReelPage
            key={item.id}
            ref={(el) => setPageRef(item.id, el)}
            item={item}
            active={item.id === activeId}
            idle={idle}
            sound={soundId === item.id}
            laneTitle={laneTitle}
            onPlaySound={() => setSoundId(item.id)}
            onOpenDetails={() => setDetailsId(item.id)}
          />
        ))}
      </div>

      {/* While a sound iframe is playing it captures every touch, so a native
          swipe can never advance the feed. We restore swiping with transparent
          edge zones layered *above* the iframe (they catch vertical swipes and
          navigate), leaving the centre free for the player's own controls, plus
          explicit ↑/↓ buttons for discoverability. None of this renders when no
          reel is playing — then the whole surface is a native scroll area. */}
      {items.length > 1 && soundId !== null && (
        <>
          <SwipeZone side="left" onPrev={() => scrollToIndex(activeIdx - 1)} onNext={() => scrollToIndex(activeIdx + 1)} />
          <SwipeZone side="right" onPrev={() => scrollToIndex(activeIdx - 1)} onNext={() => scrollToIndex(activeIdx + 1)} />
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 z-[82] flex flex-col gap-2">
            <button onClick={() => scrollToIndex(activeIdx - 1)} aria-label="Previous" className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60">
              <ChevronUp size={18} />
            </button>
            <button onClick={() => scrollToIndex(activeIdx + 1)} aria-label="Next" className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60">
              <ChevronDown size={18} />
            </button>
          </div>
        </>
      )}

      {/* Details bottom sheet */}
      {detailsItem && (
        <DetailsSheet item={detailsItem} laneTitle={laneTitle} onClose={() => setDetailsId(null)} />
      )}
    </div>
  )
}

/**
 * A transparent, mid-height edge strip that sits above the playing iframe and
 * turns a vertical swipe into prev/next navigation. It only occupies the middle
 * band of the left/right edge, so it never covers the top chips, the close
 * button, or the bottom "Instagram / Details" actions. `touchAction: 'none'`
 * keeps the browser from hijacking the gesture so our delta math stays reliable.
 */
function SwipeZone({ side, onPrev, onNext }: { side: 'left' | 'right'; onPrev: () => void; onNext: () => void }) {
  const startY = useRef<number | null>(null)
  return (
    <div
      aria-hidden
      className={[
        'pointer-events-auto absolute z-[81] top-[12%] bottom-[24%] w-[20vw] max-w-[96px]',
        side === 'left' ? 'left-0' : 'right-0',
      ].join(' ')}
      style={{ touchAction: 'none' }}
      onTouchStart={(e) => { startY.current = e.touches[0]?.clientY ?? null }}
      onTouchEnd={(e) => {
        const start = startY.current
        startY.current = null
        if (start == null) return
        const dy = (e.changedTouches[0]?.clientY ?? start) - start
        if (Math.abs(dy) < 40) return // ignore taps / tiny drags
        if (dy < 0) onNext()
        else onPrev()
      }}
    />
  )
}

const ReelPage = ({
  ref, item, active, idle, sound, laneTitle, onPlaySound, onOpenDetails,
}: {
  ref: (el: HTMLElement | null) => void
  item: MediaCardData
  active: boolean
  idle: boolean
  sound: boolean
  laneTitle?: string
  onPlaySound: () => void
  onOpenDetails: () => void
}) => {
  const [soundReady, setSoundReady] = useState(false)
  const isReel = item.platform === 'instagram'
  const PlatformIcon = isReel ? InstagramIcon : YoutubeIcon
  const portrait = mediaOrientation(item.platform, item.sourceUrl) === 'portrait'
  const poster = posterFor(item)
  const posterFallback = item.platform === 'youtube' ? youTubeThumbnail(item.embedId, 'hq') : null
  const permalink = permalinkFor(item.platform, item.embedId)
  const dateLabel = item.date ? formatRelativeDate(item.date) : null
  const hasDetails = !!item.description || item.links.length > 0 || item.attachments.length > 0
  const extrasCount = item.links.length + item.attachments.length
  // A muted preview keeps the active reel alive without eating touch, so the
  // feed stays scrollable; YouTube can autoplay muted, Instagram only via an
  // admin-supplied clip.
  const canMutedPreview = active && idle && !sound && (!!item.previewVideoUrl || item.platform === 'youtube')

  useEffect(() => { if (!sound) setSoundReady(false) }, [sound])

  return (
    <section
      ref={ref}
      data-id={item.id}
      className="relative h-[100dvh] w-full snap-start snap-always flex items-center justify-center overflow-hidden bg-black"
    >
      {/* Poster */}
      {poster ? (
        <img
          src={poster}
          alt=""
          loading={active ? 'eager' : 'lazy'}
          className={`absolute inset-0 h-full w-full ${portrait ? 'object-cover' : 'object-contain'}`}
          onError={(e) => { if (posterFallback) (e.currentTarget as HTMLImageElement).src = posterFallback }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--accent)]/25 via-black to-black">
          <PlatformIcon size={56} className="text-white/40" />
        </div>
      )}

      {/* Sound player (tap-to-play) — captures touch; use ↑/↓ to move on */}
      {active && sound && (
        <>
          {!soundReady && poster && (
            <div className="absolute inset-0 z-[3] animate-pulse bg-black/40" aria-hidden />
          )}
          <iframe
            key={`sound-${item.id}`}
            src={isReel ? instagramEmbedUrl(item.embedId, true) : youTubeEmbedUrl(item.embedId, { autoplay: true, controls: true })}
            title={item.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            scrolling="no"
            onLoad={() => { if (sound) setSoundReady(true) }}
            className={portrait
              ? 'absolute inset-0 z-[4] h-full w-full'
              : 'absolute inset-x-0 top-1/2 z-[4] aspect-video w-full -translate-y-1/2'}
          />
        </>
      )}

      {/* Muted, non-interactive preview (pointer-events-none → feed stays scrollable).
          Decorative: the poster + title overlay already convey the content, so it's
          hidden from assistive tech. */}
      {canMutedPreview && (
        item.previewVideoUrl ? (
          <video
            src={item.previewVideoUrl}
            poster={poster ?? undefined}
            muted loop autoPlay playsInline preload="metadata"
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 h-full w-full ${portrait ? 'object-cover' : 'object-contain'}`}
          />
        ) : (
          <iframe
            src={youTubeEmbedUrl(item.embedId, { autoplay: true, mute: true, controls: false, loop: true })}
            title={item.title}
            aria-hidden="true"
            tabIndex={-1}
            allow="autoplay; encrypted-media"
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={portrait ? undefined : { transform: 'scale(1.35)' }}
          />
        )
      )}

      {/* Tap surface → play with sound (a plain button doesn't block scroll) */}
      {active && !sound && (
        <button
          type="button"
          onClick={onPlaySound}
          aria-label={`Play ${item.title} with sound`}
          className="absolute inset-0 z-[5] flex items-center justify-center"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
            {canMutedPreview ? <Volume2 size={26} /> : <Play size={28} className="ml-1 fill-current" />}
          </span>
        </button>
      )}

      {/* Bottom overlay: title + meta + actions (pointer-events gated to buttons) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[6] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-16 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
        <h2 className="pr-14 text-sm font-semibold leading-snug text-white line-clamp-2">{item.title}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/70">
          <span className="inline-flex items-center gap-1"><PlatformIcon size={13} /> {isReel ? 'Reel' : 'Video'}</span>
          {laneTitle && (<><span aria-hidden>·</span><span>{laneTitle}</span></>)}
          {dateLabel && (<><span aria-hidden>·</span><span suppressHydrationWarning>{dateLabel}</span></>)}
        </div>
        <div className="pointer-events-auto mt-3 flex items-center gap-2">
          <a
            href={permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-scale inline-flex h-9 items-center gap-1.5 rounded-full bg-white/15 px-3.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/25"
          >
            <ExternalLink size={14} /> {isReel ? 'Instagram' : 'YouTube'}
          </a>
          {hasDetails && (
            <button
              type="button"
              onClick={onOpenDetails}
              className="tap-scale inline-flex h-9 items-center gap-1.5 rounded-full bg-white/15 px-3.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/25"
            >
              <Info size={14} /> Details
              {extrasCount > 0 && (
                <span className="ml-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-[11px] font-semibold text-white">
                  {extrasCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

function DetailsSheet({ item, laneTitle, onClose }: { item: MediaCardData; laneTitle?: string; onClose: () => void }) {
  const isReel = item.platform === 'instagram'
  const PlatformIcon = isReel ? InstagramIcon : YoutubeIcon
  const dateLabel = item.date ? formatRelativeDate(item.date) : null
  const permalink = permalinkFor(item.platform, item.embedId)
  const hasExtras = item.links.length > 0 || item.attachments.length > 0
  return (
    <div className="fixed inset-0 z-[88] flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-details-title"
        className="animate-sheet-in relative w-full max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-[var(--surface)] px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-[var(--border)]" />
        <div className="flex items-start justify-between gap-3">
          <h2 id="media-details-title" className="text-base font-bold leading-snug text-[var(--foreground)] line-clamp-2">{item.title}</h2>
          <button onClick={onClose} aria-label="Close details" className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]">
            <X size={18} />
          </button>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
          <span className="inline-flex items-center gap-1"><PlatformIcon size={13} /> {isReel ? 'Reel' : 'Video'}</span>
          {laneTitle && (<><span aria-hidden>·</span><span>{laneTitle}</span></>)}
          {dateLabel && (<><span aria-hidden>·</span><span suppressHydrationWarning>{dateLabel}</span></>)}
        </div>
        {item.description && (
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--muted)]">{item.description}</p>
        )}
        {hasExtras && <div className="mt-5"><MediaExtras links={item.links} attachments={item.attachments} /></div>}
        <a href={permalink} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline">
          <ExternalLink size={14} /> Open on {isReel ? 'Instagram' : 'YouTube'}
        </a>
      </div>
    </div>
  )
}

/* ─────────────────────────── Desktop: side-by-side player ────────────────── */

function DesktopPlayer({
  selected, lane, ii, multiTopic, goItem, goTopic, close,
}: {
  selected: MediaCardData
  lane: ModalGroup
  ii: number
  multiTopic: boolean
  goItem: (d: number) => void
  goTopic: (d: number) => void
  close: () => void
}) {
  const portrait = mediaOrientation(selected.platform, selected.sourceUrl) === 'portrait'
  const isReel = selected.platform === 'instagram'
  const PlatformIcon = isReel ? InstagramIcon : YoutubeIcon
  const multiItem = lane.items.length > 1
  const permalink = permalinkFor(selected.platform, selected.embedId)
  const dateLabel = selected.date ? formatRelativeDate(selected.date) : null
  const poster = posterFor(selected)
  const posterFallback = selected.platform === 'youtube' ? youTubeThumbnail(selected.embedId, 'hq') : null
  const hasExtras = selected.links.length > 0 || selected.attachments.length > 0

  const metaLine = (
    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
      <span className="inline-flex items-center gap-1"><PlatformIcon size={13} /> {isReel ? 'Reel' : 'Video'}</span>
      {lane.title && (<><span aria-hidden>·</span><span>{lane.title}</span></>)}
      {dateLabel && (<><span aria-hidden>·</span><span suppressHydrationWarning>{dateLabel}</span></>)}
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
      role="dialog"
      aria-modal="true"
      aria-label={selected.title}
    >
      <button onClick={close} aria-label="Close" className="absolute z-[80] right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
        <X size={20} />
      </button>

      {multiTopic && (
        <>
          <button onClick={(e) => { e.stopPropagation(); goTopic(-1) }} aria-label="Previous topic" className="absolute left-4 top-1/2 -translate-y-1/2 z-[78] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <ChevronLeft size={24} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); goTopic(1) }} aria-label="Next topic" className="absolute right-4 top-1/2 -translate-y-1/2 z-[78] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <ChevronRight size={24} />
          </button>
        </>
      )}

      <div className="relative flex max-h-[90dvh] flex-row items-stretch overflow-hidden rounded-2xl bg-[var(--surface)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className={['relative shrink-0 bg-black overflow-hidden', portrait ? 'h-[86dvh] w-[calc(86dvh*9/16)]' : 'h-auto w-[min(64vw,900px)] self-center aspect-video'].join(' ')}>
          {poster ? (
            <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(e) => { if (posterFallback) (e.currentTarget as HTMLImageElement).src = posterFallback }} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--accent)]/30 via-black to-black">
              <PlatformIcon size={56} className="text-white/40" />
            </div>
          )}
          <iframe
            key={selected.id}
            src={isReel ? instagramEmbedUrl(selected.embedId, true) : youTubeEmbedUrl(selected.embedId, { autoplay: true, controls: true })}
            title={selected.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            scrolling="no"
            className="absolute inset-0 h-full w-full"
          />
        </div>

        <div className="flex w-80 lg:w-96 flex-col max-h-[90dvh] bg-[var(--surface)]">
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-lg font-bold leading-snug text-[var(--foreground)]">{selected.title}</h2>
            <div className="mt-2">{metaLine}</div>
            {selected.description && (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[var(--muted)]">{selected.description}</p>
            )}
            {hasExtras && <div className="mt-5"><MediaExtras links={selected.links} attachments={selected.attachments} /></div>}
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
    </div>
  )
}
