'use client'

import { useState } from 'react'
import { Download, ExternalLink, FileText, Music, Image as ImageIcon, Video as VideoIcon } from 'lucide-react'
import type { HubItemData } from '@/lib/hub'
import { parseHubEmbed, aspectClass } from '@/lib/hub-content'
import { formatBytes, attachmentKind } from '@/lib/social'
import { cn } from '@/lib/utils'

/**
 * Renders a single content block from the hub by type. Each renders in a card
 * with title + optional description, with type-specific content below.
 * NOTE: contentHtml is pre-sanitized on the server (via sanitizePostHtml).
 */
export default function HubItemRenderer({ item }: { item: HubItemData }) {
  const [imageOpen, setImageOpen] = useState(false)

  const kindIcon = attachmentKind({ name: item.fileName || '', type: item.fileType || '' })

  return (
    <div id={`item-${item.id}`} className="space-y-3">
      {/* Title + Description */}
      {item.title && (
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">{item.title}</h3>
          {item.description && (
            <p className="text-sm text-[var(--muted)] mt-1">{item.description}</p>
          )}
        </div>
      )}

      {/* Metadata: category + tags */}
      {(item.category || item.tags.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {item.category && (
            <span
              className="inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: item.category.color || 'var(--accent)' }}
            >
              {item.category.name}
            </span>
          )}
          {item.tags.map((tag) => (
            <span
              key={tag.slug}
              className="inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium border border-[var(--border)] text-[var(--muted)]"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Content by type */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {item.type === 'link' && <LinkContent item={item} />}
        {item.type === 'text' && <TextContent item={item} />}
        {(item.type === 'markdown' || item.type === 'richtext') && <MarkdownContent item={item} />}
        {item.type === 'image' && <ImageContent item={item} imageOpen={imageOpen} setImageOpen={setImageOpen} />}
        {item.type === 'video' && <VideoContent item={item} />}
        {item.type === 'audio' && <AudioContent item={item} />}
        {item.type === 'pdf' && <PdfContent item={item} />}
        {item.type === 'file' && <FileContent item={item} kindIcon={kindIcon} />}
        {item.type === 'embed' && <EmbedContent item={item} />}
      </div>
    </div>
  )
}

function LinkContent({ item }: { item: HubItemData }) {
  return (
    <a
      href={item.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="tap-scale block p-4 text-center text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
    >
      <div className="flex items-center justify-center gap-2">
        <span className="text-base font-semibold">{item.title || 'Open link'}</span>
        <ExternalLink size={18} className="text-[var(--accent)] flex-shrink-0" />
      </div>
    </a>
  )
}

function TextContent({ item }: { item: HubItemData }) {
  return (
    <div className="p-4 whitespace-pre-wrap text-sm text-[var(--foreground)] leading-relaxed">
      {item.content}
    </div>
  )
}

function MarkdownContent({ item }: { item: HubItemData }) {
  return (
    <div className="p-4 prose dark:prose-invert max-w-none">
      {item.contentHtml ? (
        <div dangerouslySetInnerHTML={{ __html: item.contentHtml }} />
      ) : null}
    </div>
  )
}

function ImageContent({
  item,
  imageOpen,
  setImageOpen,
}: {
  item: HubItemData
  imageOpen: boolean
  setImageOpen: (open: boolean) => void
}) {
  const src = item.fileUrl || item.url
  if (!src) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setImageOpen(true)}
        className="tap-scale w-full block cursor-pointer hover:opacity-90 transition-opacity"
      >
        <img src={src} alt={item.title || ''} className="w-full h-auto rounded-xl" />
      </button>

      {item.fileUrl && (
        <div className="p-4 border-t border-[var(--border)] flex gap-2">
          <a
            href={item.fileUrl}
            download={item.fileName || undefined}
            className="flex-1 inline-flex items-center justify-center gap-2 h-9 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity text-sm font-medium"
          >
            <Download size={16} /> Download
          </a>
        </div>
      )}

      {imageOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setImageOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img src={src} alt={item.title || ''} className="w-full h-auto rounded-lg" />
            <button
              type="button"
              onClick={() => setImageOpen(false)}
              className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              aria-label="Close lightbox"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function VideoContent({ item }: { item: HubItemData }) {
  const fileUrl = item.fileUrl
  const embedData = item.url ? parseHubEmbed(item.url) : null

  // Priority: uploaded file > parsed embed > raw URL
  if (fileUrl) {
    return (
      <>
        <video
          controls
          poster={item.thumbnail || undefined}
          className="w-full rounded-xl"
          playsInline
        >
          <source src={fileUrl} type={item.fileType || 'video/mp4'} />
          Your browser does not support the video tag.
        </video>
        <div className="p-4 border-t border-[var(--border)] flex gap-2">
          <a
            href={fileUrl}
            download={item.fileName || 'video.mp4'}
            className="flex-1 inline-flex items-center justify-center gap-2 h-9 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity text-sm font-medium"
          >
            <Download size={16} /> Download
          </a>
        </div>
      </>
    )
  }

  if (embedData) {
    return (
      <div className={cn('rounded-xl border border-[var(--border)] overflow-hidden', aspectClass(embedData.aspect))}>
        <iframe
          src={embedData.src}
          allowFullScreen={embedData.allowFullScreen}
          loading="lazy"
          className="w-full h-full"
          title={item.title || 'Video'}
        />
      </div>
    )
  }

  if (item.url) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="tap-scale flex items-center justify-center gap-2 p-6 text-[var(--accent)] hover:underline"
      >
        <VideoIcon size={20} /> Open video link
      </a>
    )
  }

  return null
}

function AudioContent({ item }: { item: HubItemData }) {
  const src = item.fileUrl || item.url
  if (!src) return null

  return (
    <>
      <div className="p-4">
        <audio controls className="w-full" controlsList="nodownload">
          <source src={src} type={item.fileType || 'audio/mpeg'} />
          Your browser does not support the audio element.
        </audio>
      </div>
      {item.fileUrl && (
        <div className="px-4 pb-4 border-t border-[var(--border)] flex gap-2">
          <a
            href={item.fileUrl}
            download={item.fileName || 'audio.mp3'}
            className="flex-1 inline-flex items-center justify-center gap-2 h-9 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity text-sm font-medium"
          >
            <Download size={16} /> Download
          </a>
        </div>
      )}
    </>
  )
}

function PdfContent({ item }: { item: HubItemData }) {
  const src = item.fileUrl || item.url
  if (!src) return null

  return (
    <>
      <iframe
        src={src}
        className="w-full h-[480px] rounded-xl"
        title={item.title || 'PDF'}
      />
      <div className="p-4 border-t border-[var(--border)] flex gap-2">
        <a
          href={src}
          download={item.fileName || 'document.pdf'}
          className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity text-sm font-semibold"
        >
          <Download size={18} /> Download PDF
        </a>
      </div>
    </>
  )
}

function FileContent({
  item,
  kindIcon,
}: {
  item: HubItemData
  kindIcon: 'image' | 'video' | 'audio' | 'pdf' | 'doc'
}) {
  if (!item.fileUrl) return null

  const iconMap = {
    image: ImageIcon,
    video: VideoIcon,
    audio: Music,
    pdf: FileText,
    doc: FileText,
  }

  const Icon = iconMap[kindIcon]

  return (
    <div className="p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="shrink-0 p-2.5 rounded-lg bg-[var(--accent)]/10">
          <Icon size={20} className="text-[var(--accent)]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--foreground)] truncate">{item.fileName || 'File'}</p>
          {item.fileSize && (
            <p className="text-xs text-[var(--muted)]">{formatBytes(item.fileSize)}</p>
          )}
        </div>
      </div>
      <a
        href={item.fileUrl}
        download={item.fileName || 'file'}
        className="tap-scale shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
        title="Download file"
      >
        <Download size={18} />
      </a>
    </div>
  )
}

function EmbedContent({ item }: { item: HubItemData }) {
  if (!item.url) return null

  const embed = parseHubEmbed(item.url)
  if (!embed) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="tap-scale block p-4 text-center text-[var(--accent)] hover:underline"
      >
        Open embed ↗
      </a>
    )
  }

  return (
    <div className={cn('rounded-xl border border-[var(--border)] overflow-hidden', aspectClass(embed.aspect))}>
      <iframe
        src={embed.src}
        allowFullScreen={embed.allowFullScreen}
        loading="lazy"
        className="w-full h-full"
        title={item.title || 'Embed'}
      />
    </div>
  )
}
