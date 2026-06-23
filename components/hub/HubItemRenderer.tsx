'use client'

import { useRef, useState, useEffect } from 'react'
import { Download, ArrowUpRight, ArrowDownToLine, X, Copy, Check } from 'lucide-react'
import type { HubItemData } from '@/lib/hub'
import { type HubGalleryImage, type HubItemType, parseHubEmbed, aspectClass } from '@/lib/hub-content'
import { formatBytes } from '@/lib/social'
import { cn } from '@/lib/utils'

/**
 * Editorial content block: a numbered, rule-separated row. `link`/`file` are a
 * single line (index · title · destination · arrow); media/notes show a numbered
 * header with a type label, then the content beneath. `index` is the position in
 * the list (drives the running number). contentHtml is pre-sanitised server-side.
 */

const TYPE_LABEL: Record<HubItemType, string> = {
  link: 'Link', text: 'Note', markdown: 'Note', richtext: 'Note',
  image: 'Image', video: 'Video', audio: 'Audio', pdf: 'PDF', file: 'File', embed: 'Embed',
}

const num = (i: number) => String(i + 1).padStart(2, '0')

function hostOf(url: string | null): string | null {
  if (!url) return null
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return null }
}

export default function HubItemRenderer({ item, index }: { item: HubItemData; index: number }) {
  if (item.type === 'link') return <LinkRow item={item} index={index} />
  if (item.type === 'file') return <FileRow item={item} index={index} />
  return <MediaBlock item={item} index={index} />
}

/* ─── Shared row chrome ──────────────────────────────────────────────────── */

function Index({ children }: { children: React.ReactNode }) {
  return <span className="shrink-0 w-7 text-sm tabular-nums text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors pt-0.5">{children}</span>
}

function TypeTag({ type }: { type: HubItemType }) {
  return <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">{TYPE_LABEL[type]}</span>
}

/* ─── Link & File — single editorial rows ────────────────────────────────── */

function LinkRow({ item, index }: { item: HubItemData; index: number }) {
  const sub = item.description || hostOf(item.url)
  return (
    <a id={`item-${item.id}`} href={item.url || '#'} target="_blank" rel="noopener noreferrer"
      className="group flex items-start gap-4 py-3.5 border-b border-[var(--border)]">
      <Index>{num(index)}</Index>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors">{item.title || 'Open link'}</span>
        {sub && <span className="block text-xs text-[var(--muted)] truncate mt-0.5 tabular-nums">{sub}</span>}
      </span>
      <ArrowUpRight size={17} className="shrink-0 mt-0.5 text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
    </a>
  )
}

function FileRow({ item, index }: { item: HubItemData; index: number }) {
  if (!item.fileUrl) return null
  const sub = [item.fileName, formatBytes(item.fileSize)].filter(Boolean).join(' · ')
  return (
    <a id={`item-${item.id}`} href={item.fileUrl} download={item.fileName || 'file'}
      className="group flex items-start gap-4 py-3.5 border-b border-[var(--border)]">
      <Index>{num(index)}</Index>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors">{item.title || item.fileName || 'File'}</span>
        <span className="block text-xs text-[var(--muted)] truncate mt-0.5">{sub || 'Download'}</span>
      </span>
      <ArrowDownToLine size={16} className="shrink-0 mt-0.5 text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors" />
    </a>
  )
}

/* ─── Media / notes — numbered header + content beneath ───────────────────── */

function MediaBlock({ item, index }: { item: HubItemData; index: number }) {
  const contentRef = useRef<HTMLDivElement>(null)
  const isNote = item.type === 'text' || item.type === 'markdown' || item.type === 'richtext'
  return (
    <div id={`item-${item.id}`} className="py-3.5 border-b border-[var(--border)]">
      <div className="flex items-baseline gap-3 mb-3">
        <Index>{num(index)}</Index>
        <span className="flex-1 min-w-0">
          <span className="block font-medium text-[var(--foreground)] truncate">{item.title}</span>
          {item.description && <span className="block text-xs text-[var(--muted)] truncate mt-0.5">{item.description}</span>}
        </span>
        {isNote && <CopyButton getText={() => contentRef.current?.textContent ?? ''} />}
        <TypeTag type={item.type} />
      </div>
      <div className="sm:pl-11" ref={contentRef}>
        <Content item={item} />
      </div>
    </div>
  )
}

/** Small copy control for note blocks: swaps the icon for an animated "Copied"
 * label for ~1.5s after a successful copy. */
function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  async function handleCopy() {
    const text = getText().trim()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      return
    }
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : 'Copy note'}
      title="Copy"
      className={cn(
        'shrink-0 self-center inline-flex items-center gap-1 h-6 px-1.5 rounded-md text-[11px] font-medium transition-colors',
        copied ? 'text-green-500' : 'text-[var(--muted)] hover:text-[var(--foreground)]',
      )}
    >
      {copied ? (
        <span className="inline-flex items-center gap-1 animate-[code-copied-pop_0.32s_ease]">
          <Check size={12} strokeWidth={2.6} /> Copied
        </span>
      ) : (
        <Copy size={13} />
      )}
    </button>
  )
}

function Content({ item }: { item: HubItemData }) {
  switch (item.type) {
    case 'text':
      return <p className="whitespace-pre-wrap text-sm text-[var(--muted)] leading-relaxed">{item.content}</p>
    case 'markdown':
    case 'richtext':
      return item.contentHtml
        ? <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-3 prose-headings:mb-1.5 prose-p:my-1.5" dangerouslySetInnerHTML={{ __html: item.contentHtml }} />
        : null
    case 'image':
      return <ImageContent item={item} />
    case 'video':
      return <VideoContent item={item} />
    case 'audio': {
      const src = item.fileUrl || item.url
      return src ? <audio controls className="w-full h-9"><source src={src} type={item.fileType || 'audio/mpeg'} /></audio> : null
    }
    case 'pdf': {
      const src = item.fileUrl || item.url
      if (!src) return null
      return (
        <div className="space-y-2">
          <iframe src={src} className="w-full h-[24rem] rounded-lg border border-[var(--border)]" title={item.title || 'PDF'} />
          <a href={src} download={item.fileName || 'document.pdf'} className="tap-scale inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[var(--accent)] text-white text-xs font-medium hover:opacity-90"><Download size={14} /> Download PDF</a>
        </div>
      )
    }
    case 'embed': {
      const embed = item.url ? parseHubEmbed(item.url) : null
      if (!embed) return item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent)] hover:underline inline-flex items-center gap-1">Open embed <ArrowUpRight size={14} /></a> : null
      return (
        <div className={cn('w-full overflow-hidden rounded-lg border border-[var(--border)]', aspectClass(embed.aspect))}>
          <iframe src={embed.src} allowFullScreen={embed.allowFullScreen} loading="lazy" className="w-full h-full" title={item.title || 'Embed'} />
        </div>
      )
    }
    default:
      return null
  }
}

function ImageContent({ item }: { item: HubItemData }) {
  if (item.images.length === 0) return null
  if (item.images.length === 1) return <SingleImage image={item.images[0]} title={item.title} />
  return <ImageGallery images={item.images} title={item.title} />
}

function SingleImage({ image, title }: { image: HubGalleryImage; title: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="space-y-2">
      <button type="button" onClick={() => setOpen(true)} className="tap-scale block w-full cursor-zoom-in overflow-hidden rounded-lg border border-[var(--border)]">
        <img src={image.url} alt={title || ''} loading="lazy" className="w-full h-auto" />
      </button>
      {image.fileName && <a href={image.url} download={image.fileName} className="tap-scale inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[var(--accent)] text-white text-xs font-medium hover:opacity-90"><Download size={14} /> Download</a>}
      {open && <GalleryLightbox images={[image]} initialIndex={0} onClose={() => setOpen(false)} />}
    </div>
  )
}

/** Instagram-style swipeable photo gallery: a snap-scroll row of full-width
 * slides with a position counter + dots, opening to a full-screen swipeable
 * lightbox on tap. */
function ImageGallery({ images, title }: { images: HubGalleryImage[]; title: string }) {
  const scroller = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)

  function handleScroll() {
    const el = scroller.current
    if (!el || el.clientWidth === 0) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    setActive(Math.min(images.length - 1, Math.max(0, idx)))
  }

  const current = images[active]

  return (
    <div className="space-y-2">
      <div className="relative">
        <div
          ref={scroller}
          onScroll={handleScroll}
          className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth rounded-lg border border-[var(--border)]"
        >
          {images.map((img, idx) => (
            <button
              key={`${img.url}-${idx}`}
              type="button"
              onClick={() => { setActive(idx); setOpen(true) }}
              className="tap-scale shrink-0 w-full snap-center cursor-zoom-in self-center"
            >
              <img src={img.url} alt={title || ''} loading="lazy" className="w-full h-auto" />
            </button>
          ))}
        </div>
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs font-medium tabular-nums">
          {active + 1}/{images.length}
        </span>
      </div>
      <div className="flex items-center justify-center gap-1.5">
        {images.map((_, idx) => (
          <span key={idx} className={cn('h-1.5 w-1.5 rounded-full transition-colors', idx === active ? 'bg-[var(--accent)]' : 'bg-[var(--border)]')} />
        ))}
      </div>
      {current?.fileName && <a href={current.url} download={current.fileName} className="tap-scale inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[var(--accent)] text-white text-xs font-medium hover:opacity-90"><Download size={14} /> Download</a>}
      {open && <GalleryLightbox images={images} initialIndex={active} onClose={() => setOpen(false)} />}
    </div>
  )
}

type Zoom = { scale: number; x: number; y: number }
const NO_ZOOM: Zoom = { scale: 1, x: 0, y: 0 }
const MAX_SCALE = 4

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)
/** Keep a pan within bounds so a zoomed image can't be dragged off-screen. */
function clampZoom(z: Zoom, el: HTMLElement): Zoom {
  if (z.scale <= 1) return NO_ZOOM
  const maxX = (el.clientWidth * (z.scale - 1)) / 2
  const maxY = (el.clientHeight * (z.scale - 1)) / 2
  return { scale: z.scale, x: clamp(z.x, -maxX, maxX), y: clamp(z.y, -maxY, maxY) }
}

/**
 * Full-screen photo viewer: a transform-based carousel driven by pointer events.
 * Two-finger pinch (and ctrl/⌘+wheel on trackpads) zooms; drag pans when zoomed
 * and swipes between photos otherwise; double-tap toggles zoom. Closes on the
 * button, Escape, a tap on the backdrop, or the browser back gesture.
 */
function GalleryLightbox({ images, initialIndex, onClose }: { images: HubGalleryImage[]; initialIndex: number; onClose: () => void }) {
  const container = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(initialIndex)
  const [zoom, setZoom] = useState<Zoom>(NO_ZOOM)
  const [dragX, setDragX] = useState(0)
  const [animate, setAnimate] = useState(false)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Active pointers + the in-flight gesture's starting baseline.
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const g = useRef({ mode: 'none' as 'none' | 'swipe' | 'pan' | 'pinch', startX: 0, startY: 0, startDist: 0, startScale: 1, startX0: 0, startY0: 0, moved: false })

  // Lock body scroll, close on Escape, and make the browser back button /
  // swipe-back close the viewer instead of navigating off the page. All closes
  // go through history.back() → popstate (see `requestClose`); cleanup never
  // calls history.back() itself, because under React's dev double-mount that
  // fired an async popstate onto the remounted listener and flickered the modal
  // shut on open.
  useEffect(() => {
    window.history.pushState({ hubLightbox: true }, '')
    const onPop = () => onCloseRef.current()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') window.history.back() }
    window.addEventListener('popstate', onPop)
    window.addEventListener('keydown', onKey)
    const orig = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = orig
    }
  }, [])

  const requestClose = () => window.history.back()

  // Trackpad pinch arrives as wheel + ctrl/meta; needs a non-passive listener to
  // preventDefault (browser-zoom) and zoom the image instead.
  useEffect(() => {
    const el = container.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      setAnimate(false)
      setZoom((z) => clampZoom({ scale: clamp(z.scale - e.deltaY * 0.01, 1, MAX_SCALE), x: z.x, y: z.y }, el))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  function onPointerDown(e: React.PointerEvent) {
    container.current?.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    setAnimate(false)
    const pts = [...pointers.current.values()]
    g.current.moved = false
    if (pts.length === 2) {
      g.current.mode = 'pinch'
      g.current.startDist = dist(pts[0], pts[1])
      g.current.startScale = zoom.scale
    } else {
      g.current.mode = zoom.scale > 1 ? 'pan' : 'swipe'
      g.current.startX = e.clientX
      g.current.startY = e.clientY
      g.current.startX0 = zoom.x
      g.current.startY0 = zoom.y
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const el = container.current
    if (!el) return
    const pts = [...pointers.current.values()]
    if (g.current.mode === 'pinch' && pts.length >= 2) {
      const scale = clamp(g.current.startScale * (dist(pts[0], pts[1]) / g.current.startDist), 1, MAX_SCALE)
      g.current.moved = true
      setZoom((z) => clampZoom({ scale, x: z.x, y: z.y }, el))
    } else if (g.current.mode === 'pan' && pts.length === 1) {
      const dx = e.clientX - g.current.startX
      const dy = e.clientY - g.current.startY
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) g.current.moved = true
      setZoom(clampZoom({ scale: zoom.scale, x: g.current.startX0 + dx, y: g.current.startY0 + dy }, el))
    } else if (g.current.mode === 'swipe' && pts.length === 1) {
      const dx = e.clientX - g.current.startX
      if (Math.abs(dx) > 4) g.current.moved = true
      setDragX(dx)
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId)
    const el = container.current
    const remaining = pointers.current.size
    const mode = g.current.mode

    if (mode === 'pinch') {
      if (zoom.scale <= 1.01) { setAnimate(true); setZoom(NO_ZOOM) }
      if (remaining === 1) {
        const p = [...pointers.current.values()][0]
        g.current.mode = 'pan'; g.current.startX = p.x; g.current.startY = p.y; g.current.startX0 = zoom.x; g.current.startY0 = zoom.y
      } else if (remaining === 0) {
        g.current.mode = 'none'
      }
      return
    }

    if (remaining > 0) return

    if (mode === 'swipe') {
      if (!g.current.moved) { requestClose(); return } // tap closes
      const width = el?.clientWidth ?? window.innerWidth
      let next = active
      if (dragX < -width * 0.2 && active < images.length - 1) next = active + 1
      else if (dragX > width * 0.2 && active > 0) next = active - 1
      setAnimate(true)
      setDragX(0)
      if (next !== active) { setActive(next); setZoom(NO_ZOOM) }
    }
    g.current.mode = 'none'
  }

  function onDoubleClick() {
    const el = container.current
    if (!el) return
    setAnimate(true)
    setZoom((z) => (z.scale > 1 ? NO_ZOOM : { scale: 2.5, x: 0, y: 0 }))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85" role="dialog" aria-modal="true">
      <div
        ref={container}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
        className="absolute inset-0 overflow-hidden touch-none select-none"
      >
        <div
          className="flex h-full w-full"
          style={{ transform: `translateX(calc(${-active * 100}% + ${dragX}px))`, transition: animate ? 'transform 0.25s ease' : 'none' }}
        >
          {images.map((img, idx) => (
            <div key={`${img.url}-${idx}`} className="flex h-full w-full shrink-0 items-center justify-center p-4">
              <img
                src={img.url}
                alt=""
                draggable={false}
                style={idx === active ? { transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`, transition: animate ? 'transform 0.25s ease' : 'none' } : undefined}
                className="max-w-full max-h-[90vh] w-auto rounded-lg"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={requestClose}
        aria-label="Close"
        className="tap-scale absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
      >
        <X size={20} />
      </button>
      {images.length > 1 && (
        <>
          <span className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-medium tabular-nums">
            {active + 1}/{images.length}
          </span>
          <div className="absolute inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] flex items-center justify-center gap-1.5 pointer-events-none">
            {images.map((_, idx) => (
              <span key={idx} className={cn('h-1.5 w-1.5 rounded-full transition-colors', idx === active ? 'bg-white' : 'bg-white/40')} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function VideoContent({ item }: { item: HubItemData }) {
  const embed = item.url ? parseHubEmbed(item.url) : null
  if (item.fileUrl) {
    return (
      <div className="space-y-2">
        <video controls poster={item.thumbnail || undefined} playsInline className="w-full max-h-[26rem] rounded-lg border border-[var(--border)] bg-black"><source src={item.fileUrl} type={item.fileType || 'video/mp4'} /></video>
        <a href={item.fileUrl} download={item.fileName || 'video.mp4'} className="tap-scale inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[var(--accent)] text-white text-xs font-medium hover:opacity-90"><Download size={14} /> Download</a>
      </div>
    )
  }
  if (embed) {
    return (
      <div className={cn('w-full overflow-hidden rounded-lg border border-[var(--border)]', aspectClass(embed.aspect))}>
        <iframe src={embed.src} allowFullScreen={embed.allowFullScreen} loading="lazy" className="w-full h-full" title={item.title || 'Video'} />
      </div>
    )
  }
  return item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent)] hover:underline inline-flex items-center gap-1">Open video <ArrowUpRight size={14} /></a> : null
}
