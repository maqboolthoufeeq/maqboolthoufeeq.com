'use client'

import { useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import type { MediaCardData } from '@/lib/media'
import { InstagramIcon, YoutubeIcon } from '@/components/social/icons'
import { formatRelativeDate } from '@/lib/utils'
import {
  mediaOrientation,
  aspectClassForOrientation,
  resolveThumbnail,
  youTubeThumbnail,
  youTubeEmbedUrl,
} from '@/lib/social'

const WIDTH: Record<'portrait' | 'landscape', string> = {
  portrait: 'w-40 sm:w-44',
  landscape: 'w-64 sm:w-72',
}

/**
 * A single reel/video tile. Shows a poster image, then an autoplaying muted
 * preview on hover (desktop) or when scrolled into view on touch — using the
 * admin's preview clip when available, or a chromeless muted YouTube embed.
 * Clicking opens the full player modal.
 */
export default function MediaCard({
  item,
  onOpen,
  className = '',
}: {
  item: MediaCardData
  onOpen: (id: string) => void
  className?: string
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(true)
  const [preview, setPreview] = useState(false)
  const [canHover, setCanHover] = useState(false)

  // Clear any pending hover timer and block late state updates after unmount.
  useEffect(() => {
    return () => {
      mounted.current = false
      if (hoverTimer.current) clearTimeout(hoverTimer.current)
    }
  }, [])

  const thumb = resolveThumbnail(item.platform, item.embedId, item.thumbnailUrl, 'maxres')
  const orientation = mediaOrientation(item.platform, item.sourceUrl)
  const hasClip = !!item.previewVideoUrl
  // Hover preview: a clip if provided, else YouTube's own muted embed. Instagram
  // can't be silently autoplayed by third parties — its reels play on tap/click.
  const canPreview = hasClip || item.platform === 'youtube'

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      setCanHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches)
    }
  }, [])

  // Touch devices: autoplay the (lightweight) clip when the card is in view.
  useEffect(() => {
    if (canHover || !hasClip) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (mounted.current) setPreview(entry.isIntersecting && entry.intersectionRatio >= 0.7)
      },
      { threshold: [0, 0.7, 1] },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [canHover, hasClip])

  function startHover() {
    if (!canHover || !canPreview) return
    hoverTimer.current = setTimeout(() => {
      if (mounted.current) setPreview(true)
    }, 320)
  }
  function endHover() {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    if (canHover) setPreview(false)
  }

  const PlatformIcon = item.platform === 'instagram' ? InstagramIcon : YoutubeIcon

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onOpen(item.id)}
      onMouseEnter={startHover}
      onMouseLeave={endHover}
      aria-label={`Play ${item.title}`}
      className={[
        'group relative shrink-0 snap-start overflow-hidden rounded-2xl bg-black text-left',
        'border border-[var(--border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
        'transition-transform duration-200 hover:-translate-y-1',
        WIDTH[orientation],
        aspectClassForOrientation(orientation),
        className,
      ].join(' ')}
    >
      {/* Poster */}
      {thumb ? (
        <img
          src={thumb}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement
            if (item.platform === 'youtube' && !img.dataset.fellback) {
              img.dataset.fellback = '1'
              img.src = youTubeThumbnail(item.embedId, 'hq')
            }
          }}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[var(--accent)]/40 via-[var(--accent)]/10 to-black">
          <PlatformIcon size={40} className="text-white/75" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
            {item.platform === 'instagram' ? 'Reel' : 'Video'}
          </span>
        </div>
      )}

      {/* Preview layer (hover desktop / in-view touch) */}
      {preview && item.previewVideoUrl && (
        <video
          src={item.previewVideoUrl}
          poster={thumb ?? undefined}
          muted
          loop
          autoPlay
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {preview && !hasClip && item.platform === 'youtube' && (
        <iframe
          src={youTubeEmbedUrl(item.embedId, { autoplay: true, mute: true, controls: false, loop: true })}
          title={item.title}
          allow="autoplay; encrypted-media"
          className="pointer-events-none absolute inset-0 h-full w-full"
          // Landscape: scale up to crop the chromeless embed's letterboxing.
          // Shorts (portrait) already fill a 9:16 card, so leave them be.
          style={orientation === 'landscape' ? { transform: 'scale(1.35)' } : undefined}
        />
      )}

      {/* Top-left platform badge */}
      <span className="absolute left-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
        <PlatformIcon size={14} />
      </span>

      {/* Top-right recency pill */}
      {item.date && (
        <span
          suppressHydrationWarning
          className="absolute right-2 top-2 z-10 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm"
        >
          {formatRelativeDate(item.date)}
        </span>
      )}

      {/* Center play affordance — fades out while previewing */}
      <span
        className={[
          'absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-200',
          preview ? 'opacity-0' : 'opacity-100',
        ].join(' ')}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition-transform duration-200 group-hover:scale-110">
          <Play size={20} className="ml-0.5 fill-current" />
        </span>
      </span>

      {/* Bottom gradient + title */}
      <span className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-3 pt-8">
        <span className="block text-sm font-semibold leading-snug text-white line-clamp-2">
          {item.title}
        </span>
        {item.categoryName && (
          <span className="mt-1 inline-block text-[11px] font-medium text-white/70">
            {item.categoryName}
          </span>
        )}
      </span>
    </button>
  )
}
