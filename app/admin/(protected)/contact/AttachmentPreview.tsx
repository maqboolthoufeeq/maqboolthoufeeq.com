'use client'

import { useState } from 'react'
import { X, Download, FileText } from 'lucide-react'

interface Props {
  url: string
  name: string
  size: number | null
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getKind(name: string): 'image' | 'video' | 'other' {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image'
  if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video'
  return 'other'
}

export function AttachmentPreview({ url, name, size }: Props) {
  const [open, setOpen] = useState(false)
  const kind = getKind(name)

  return (
    <>
      <div className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] w-fit max-w-xs">
        {/* Thumbnail */}
        {kind === 'image' && (
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-[var(--border)] hover:opacity-80 transition-opacity"
          >
            <img src={url} alt={name} className="w-full h-full object-cover" />
          </button>
        )}
        {kind === 'video' && (
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-[var(--border)] hover:opacity-80 transition-opacity relative"
          >
            <video src={url} className="w-full h-full object-cover" muted preload="metadata" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/30">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
        {kind === 'other' && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 w-16 h-16 rounded-lg border border-[var(--border)] flex items-center justify-center bg-[var(--surface)] hover:border-[var(--accent)] transition-colors"
          >
            <FileText size={22} className="text-[var(--muted)]" />
          </a>
        )}

        {/* Meta */}
        <div className="min-w-0 flex-1 py-0.5">
          <p className="text-sm text-[var(--foreground)] truncate font-medium">{name}</p>
          {size != null && (
            <p className="text-xs text-[var(--muted)] mt-0.5">{formatBytes(size)}</p>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download={name}
            className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
          >
            <Download size={11} />
            Download
          </a>
        </div>
      </div>

      {/* Lightbox */}
      {open && (kind === 'image' || kind === 'video') && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div
            className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {kind === 'image' && (
              <img
                src={url}
                alt={name}
                className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl"
              />
            )}
            {kind === 'video' && (
              <video
                src={url}
                controls
                autoPlay
                className="max-h-[80vh] max-w-full rounded-xl shadow-2xl"
              />
            )}
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <span className="truncate max-w-xs">{name}</span>
              {size != null && <span className="shrink-0 text-white/50">· {formatBytes(size)}</span>}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                download={name}
                className="shrink-0 flex items-center gap-1 text-white/70 hover:text-white transition-colors"
              >
                <Download size={13} />
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
