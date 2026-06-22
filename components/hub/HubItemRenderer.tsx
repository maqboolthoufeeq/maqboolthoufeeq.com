'use client'

import { useRef, useState } from 'react'
import { Download, ArrowUpRight, ArrowDownToLine } from 'lucide-react'
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
  return (
    <div id={`item-${item.id}`} className="py-3.5 border-b border-[var(--border)]">
      <div className="flex items-baseline gap-4 mb-3">
        <Index>{num(index)}</Index>
        <span className="flex-1 min-w-0">
          <span className="block font-medium text-[var(--foreground)] truncate">{item.title}</span>
          {item.description && <span className="block text-xs text-[var(--muted)] truncate mt-0.5">{item.description}</span>}
        </span>
        <TypeTag type={item.type} />
      </div>
      <div className="sm:pl-11">
        <Content item={item} />
      </div>
    </div>
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
        <img src={image.url} alt={title || ''} loading="lazy" className="w-full h-auto max-h-[26rem] object-cover" />
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
              className="tap-scale shrink-0 w-full snap-center cursor-zoom-in"
            >
              <img src={img.url} alt={title || ''} loading="lazy" className="w-full h-auto max-h-[26rem] object-cover" />
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

/** Full-screen swipeable lightbox shared by single and multi-photo blocks. */
function GalleryLightbox({ images, initialIndex, onClose }: { images: HubGalleryImage[]; initialIndex: number; onClose: () => void }) {
  const scroller = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(initialIndex)

  function handleScroll() {
    const el = scroller.current
    if (!el || el.clientWidth === 0) return
    setActive(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85" onClick={onClose}>
      <div
        ref={(el) => {
          scroller.current = el
          if (el) el.scrollLeft = initialIndex * el.clientWidth
        }}
        onScroll={handleScroll}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full overflow-x-auto no-scrollbar snap-x snap-mandatory"
      >
        {images.map((img, idx) => (
          <div key={`${img.url}-${idx}`} className="flex h-full w-full shrink-0 snap-center items-center justify-center p-4">
            <img src={img.url} alt="" className="max-w-full max-h-[90vh] w-auto rounded-lg" />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-medium tabular-nums">
          {active + 1}/{images.length}
        </span>
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
