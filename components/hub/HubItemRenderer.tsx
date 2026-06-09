'use client'

import { useState } from 'react'
import { Download, ExternalLink, FileText, Music, Image as ImageIcon, Video as VideoIcon, Link as LinkIcon, X } from 'lucide-react'
import type { HubItemData } from '@/lib/hub'
import { parseHubEmbed, aspectClass } from '@/lib/hub-content'
import { formatBytes, attachmentKind } from '@/lib/social'
import { cn } from '@/lib/utils'

/**
 * Renders one hub content block by type, tuned for a tight, link-first layout:
 * `link` blocks are clean tappable rows (the Linktree feel); media/file blocks
 * are compact cards with a small caption footer. No cover/background imagery.
 * `contentHtml` is pre-sanitised on the server (sanitizePostHtml).
 */
export default function HubItemRenderer({ item }: { item: HubItemData }) {
  switch (item.type) {
    case 'link':
      return <LinkRow item={item} />
    case 'text':
      return <TextBlock item={item} />
    case 'markdown':
    case 'richtext':
      return <MarkdownBlock item={item} />
    case 'image':
      return <ImageBlock item={item} />
    case 'video':
      return <VideoBlock item={item} />
    case 'audio':
      return <AudioBlock item={item} />
    case 'pdf':
      return <PdfBlock item={item} />
    case 'file':
      return <FileRow item={item} />
    case 'embed':
      return <EmbedBlock item={item} />
    default:
      return null
  }
}

/** Bare host (e.g. "nextjs.org") shown under a link when it has no description. */
function hostOf(url: string | null): string | null {
  if (!url) return null
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return null }
}

/* ─── Link — the primary, tightly-stacked row ────────────────────────────── */

function LinkRow({ item }: { item: HubItemData }) {
  const sub = item.description || hostOf(item.url)
  return (
    <a
      id={`item-${item.id}`}
      href={item.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 transition-all hover:border-[var(--accent)] hover:bg-[var(--accent)]/[0.05] active:scale-[0.99]"
    >
      <span className="shrink-0 grid place-items-center w-9 h-9 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
        <LinkIcon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors">{item.title || 'Open link'}</span>
        {sub && <span className="block text-xs text-[var(--muted)] truncate">{sub}</span>}
      </span>
      <ExternalLink size={16} className="shrink-0 text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors" />
    </a>
  )
}

/* ─── Shared compact card shell for media/text blocks ────────────────────── */

function Caption({ title, description, action }: { title?: string | null; description?: string | null; action?: React.ReactNode }) {
  if (!title && !description && !action) return null
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5 border-t border-[var(--border)]">
      <div className="min-w-0 flex-1">
        {title && <p className="text-sm font-medium text-[var(--foreground)] truncate">{title}</p>}
        {description && <p className="text-xs text-[var(--muted)] truncate">{description}</p>}
      </div>
      {action}
    </div>
  )
}

function DownloadBtn({ href, name, label = 'Download' }: { href: string; name?: string | null; label?: string }) {
  return (
    <a
      href={href}
      download={name || undefined}
      className="tap-scale shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[var(--accent)] text-white text-xs font-medium hover:opacity-90 transition-opacity"
    >
      <Download size={14} /> {label}
    </a>
  )
}

function Card({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div id={`item-${id}`} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {children}
    </div>
  )
}

/* ─── Text / Markdown ────────────────────────────────────────────────────── */

function TextBlock({ item }: { item: HubItemData }) {
  return (
    <Card id={item.id}>
      <div className="px-4 py-3.5">
        {item.title && <p className="text-sm font-semibold text-[var(--foreground)] mb-1.5">{item.title}</p>}
        <p className="whitespace-pre-wrap text-sm text-[var(--muted)] leading-relaxed">{item.content}</p>
      </div>
    </Card>
  )
}

function MarkdownBlock({ item }: { item: HubItemData }) {
  return (
    <Card id={item.id}>
      <div className="px-4 py-3">
        {item.title && <p className="text-sm font-semibold text-[var(--foreground)] mb-1">{item.title}</p>}
        {item.contentHtml && (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-3 prose-headings:mb-1.5 prose-p:my-1.5" dangerouslySetInnerHTML={{ __html: item.contentHtml }} />
        )}
      </div>
    </Card>
  )
}

/* ─── Image (with lightbox) ──────────────────────────────────────────────── */

function ImageBlock({ item }: { item: HubItemData }) {
  const [open, setOpen] = useState(false)
  const src = item.fileUrl || item.url
  if (!src) return null
  return (
    <Card id={item.id}>
      <button type="button" onClick={() => setOpen(true)} className="tap-scale block w-full cursor-zoom-in">
        <img src={src} alt={item.title || ''} loading="lazy" className="w-full h-auto max-h-[28rem] object-cover" />
      </button>
      <Caption title={item.title} description={item.description} action={item.fileUrl ? <DownloadBtn href={item.fileUrl} name={item.fileName} /> : undefined} />
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setOpen(false)}>
          <img src={src} alt={item.title || ''} className="max-w-full max-h-[90vh] w-auto h-auto rounded-lg" onClick={(e) => e.stopPropagation()} />
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"><X size={20} /></button>
        </div>
      )}
    </Card>
  )
}

/* ─── Video / Embed ──────────────────────────────────────────────────────── */

function VideoBlock({ item }: { item: HubItemData }) {
  const embed = item.url ? parseHubEmbed(item.url) : null
  return (
    <Card id={item.id}>
      {item.fileUrl ? (
        <video controls poster={item.thumbnail || undefined} playsInline className="w-full max-h-[28rem] bg-black">
          <source src={item.fileUrl} type={item.fileType || 'video/mp4'} />
        </video>
      ) : embed ? (
        <div className={cn('w-full', aspectClass(embed.aspect))}>
          <iframe src={embed.src} allowFullScreen={embed.allowFullScreen} loading="lazy" className="w-full h-full" title={item.title || 'Video'} />
        </div>
      ) : item.url ? (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="tap-scale flex items-center justify-center gap-2 px-4 py-5 text-sm text-[var(--accent)] hover:underline"><VideoIcon size={18} /> Open video</a>
      ) : null}
      <Caption title={item.title} description={item.description} action={item.fileUrl ? <DownloadBtn href={item.fileUrl} name={item.fileName} /> : undefined} />
    </Card>
  )
}

function EmbedBlock({ item }: { item: HubItemData }) {
  const embed = item.url ? parseHubEmbed(item.url) : null
  return (
    <Card id={item.id}>
      {embed ? (
        <div className={cn('w-full', aspectClass(embed.aspect))}>
          <iframe src={embed.src} allowFullScreen={embed.allowFullScreen} loading="lazy" className="w-full h-full" title={item.title || 'Embed'} />
        </div>
      ) : item.url ? (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="tap-scale flex items-center justify-center gap-2 px-4 py-5 text-sm text-[var(--accent)] hover:underline">Open embed <ExternalLink size={15} /></a>
      ) : null}
      <Caption title={item.title} description={item.description} />
    </Card>
  )
}

/* ─── Audio ──────────────────────────────────────────────────────────────── */

function AudioBlock({ item }: { item: HubItemData }) {
  const src = item.fileUrl || item.url
  if (!src) return null
  return (
    <Card id={item.id}>
      <div className="px-3.5 py-3 flex items-center gap-3">
        <span className="shrink-0 grid place-items-center w-9 h-9 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]"><Music size={16} /></span>
        <div className="min-w-0 flex-1">
          {item.title && <p className="text-sm font-medium text-[var(--foreground)] truncate">{item.title}</p>}
          <audio controls className="w-full mt-1.5 h-8"><source src={src} type={item.fileType || 'audio/mpeg'} /></audio>
        </div>
        {item.fileUrl && <DownloadBtn href={item.fileUrl} name={item.fileName} label="" />}
      </div>
    </Card>
  )
}

/* ─── PDF ────────────────────────────────────────────────────────────────── */

function PdfBlock({ item }: { item: HubItemData }) {
  const src = item.fileUrl || item.url
  if (!src) return null
  return (
    <Card id={item.id}>
      <iframe src={src} className="w-full h-[26rem]" title={item.title || 'PDF'} />
      <Caption title={item.title || 'PDF document'} description={item.description} action={<DownloadBtn href={src} name={item.fileName} label="PDF" />} />
    </Card>
  )
}

/* ─── File ───────────────────────────────────────────────────────────────── */

const FILE_ICON = { image: ImageIcon, video: VideoIcon, audio: Music, pdf: FileText, doc: FileText }

function FileRow({ item }: { item: HubItemData }) {
  if (!item.fileUrl) return null
  const Icon = FILE_ICON[attachmentKind({ name: item.fileName || '', type: item.fileType || '' })]
  return (
    <a
      id={`item-${item.id}`}
      href={item.fileUrl}
      download={item.fileName || 'file'}
      className="group flex items-center gap-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 transition-all hover:border-[var(--accent)] hover:bg-[var(--accent)]/[0.05] active:scale-[0.99]"
    >
      <span className="shrink-0 grid place-items-center w-9 h-9 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]"><Icon size={16} /></span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-[var(--foreground)] truncate">{item.title || item.fileName || 'File'}</span>
        <span className="block text-xs text-[var(--muted)] truncate">{[item.fileName, formatBytes(item.fileSize)].filter(Boolean).join(' · ') || 'Download'}</span>
      </span>
      <Download size={16} className="shrink-0 text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors" />
    </a>
  )
}
