'use client'

import { useState } from 'react'
import { ExternalLink, Download, FileText, Film, Music, File as FileIcon, X, Eye } from 'lucide-react'
import { type MediaLink, type MediaAttachment, attachmentKind, formatBytes } from '@/lib/social'

/**
 * Public-facing "extras" under a reel/video: the admin's related links (open in
 * a new tab) and downloadable attachments (images / video / PDF preview inline
 * in a lightbox, everything else downloads). Themed with CSS vars so it sits
 * happily in both the light desktop side panel and the mobile details sheet.
 */
export default function MediaExtras({
  links,
  attachments,
}: {
  links: MediaLink[]
  attachments: MediaAttachment[]
}) {
  const [preview, setPreview] = useState<MediaAttachment | null>(null)
  if (links.length === 0 && attachments.length === 0) return null

  return (
    <div className="space-y-5">
      {links.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">Links</h3>
          <div className="flex flex-col gap-2">
            {links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-scale group flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                <ExternalLink size={15} className="shrink-0 text-[var(--accent)]" />
                <span className="min-w-0 flex-1 truncate">{link.label}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {attachments.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">Attachments</h3>
          <div className="flex flex-col gap-2">
            {attachments.map((att, i) => (
              <AttachmentCard key={i} att={att} onPreview={() => setPreview(att)} />
            ))}
          </div>
        </section>
      )}

      {preview && <AttachmentLightbox att={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}

function AttachmentCard({ att, onPreview }: { att: MediaAttachment; onPreview: () => void }) {
  const kind = attachmentKind(att)
  const size = formatBytes(att.size)
  // Images & video preview inline in the lightbox; PDFs open in a new tab where
  // the browser's own (origin-isolated) viewer renders them; everything else
  // just downloads.
  const inlinePreview = kind === 'image' || kind === 'video'
  const isPdf = kind === 'pdf'
  const Icon = kind === 'video' ? Film : kind === 'audio' ? Music : kind === 'pdf' || kind === 'doc' ? FileText : FileIcon

  const thumbClass =
    'relative shrink-0 h-12 w-12 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center text-[var(--muted)]'
  const thumbInner = (
    <>
      {kind === 'image' ? (
        <img src={att.url} alt="" className="h-full w-full object-cover" />
      ) : (
        <Icon size={20} />
      )}
      <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity text-white">
        <Eye size={16} />
      </span>
    </>
  )

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-2">
      {/* Thumbnail / icon — previews inline, opens a PDF in a new tab, else a static icon */}
      {inlinePreview ? (
        <button type="button" onClick={onPreview} aria-label={`Preview ${att.name}`} className={`tap-scale ${thumbClass}`}>
          {thumbInner}
        </button>
      ) : isPdf ? (
        <a href={att.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${att.name}`} className={`tap-scale ${thumbClass}`}>
          {thumbInner}
        </a>
      ) : (
        <span className={thumbClass}>
          <Icon size={20} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--foreground)] truncate">{att.name}</p>
        <div className="mt-0.5 -my-1 flex flex-wrap items-center gap-x-1 gap-y-0 text-xs text-[var(--muted)]">
          {size && <span className="py-1">{size}</span>}
          {inlinePreview && (
            <button type="button" onClick={onPreview} className="inline-flex items-center gap-1 py-1 pr-1.5 text-[var(--accent)] hover:underline">
              <Eye size={12} /> Preview
            </button>
          )}
          {isPdf && (
            <a href={att.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 py-1 pr-1.5 text-[var(--accent)] hover:underline">
              <ExternalLink size={12} /> Open
            </a>
          )}
          <a
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            download={att.name}
            className="inline-flex items-center gap-1 py-1 pr-1.5 text-[var(--accent)] hover:underline"
          >
            <Download size={12} /> Download
          </a>
        </div>
      </div>
    </div>
  )
}

function AttachmentLightbox({ att, onClose }: { att: MediaAttachment; onClose: () => void }) {
  const kind = attachmentKind(att)
  const size = formatBytes(att.size)

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={att.name}
    >
      <button
        onClick={onClose}
        aria-label="Close preview"
        className="absolute right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X size={20} />
      </button>

      <div className="relative flex max-h-[88dvh] w-full max-w-4xl flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        {kind === 'image' && (
          <img src={att.url} alt={att.name} className="max-h-[80dvh] max-w-full rounded-xl object-contain shadow-2xl" />
        )}
        {kind === 'video' && (
          <video src={att.url} controls autoPlay playsInline className="max-h-[80dvh] max-w-full rounded-xl shadow-2xl" />
        )}

        <div className="flex items-center gap-3 text-sm text-white/80">
          <span className="truncate max-w-[60vw]">{att.name}</span>
          {size && <span className="shrink-0 text-white/50">· {size}</span>}
          <a
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            download={att.name}
            className="shrink-0 inline-flex items-center gap-1 text-white/70 hover:text-white transition-colors"
          >
            <Download size={13} /> Download
          </a>
        </div>
      </div>
    </div>
  )
}
