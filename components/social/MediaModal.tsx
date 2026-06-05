'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import type { MediaCardData } from '@/lib/media'
import { InstagramIcon, YoutubeIcon } from '@/components/social/icons'
import { youTubeEmbedUrl, instagramEmbedUrl, permalinkFor, mediaOrientation } from '@/lib/social'
import { formatRelativeDate } from '@/lib/utils'

/**
 * Returns a stable `openMedia(id)` that drives the player modal via the
 * `?media=<id>` query param — shareable and back-button friendly, mirroring the
 * project detail modal pattern used elsewhere on the site.
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
 * Full-screen player. Reads the active id from `?media=`, renders the right
 * embed (YouTube iframe / Instagram embed) and lets the visitor page through
 * siblings. Drop one instance alongside any carousels that use `useOpenMedia()`.
 */
export default function MediaModal({ items }: { items: MediaCardData[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [selected, setSelected] = useState<MediaCardData | null>(null)

  useEffect(() => {
    const id = searchParams.get('media')
    setSelected(id ? items.find((m) => m.id === id) ?? null : null)
  }, [searchParams, items])

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('media')
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [router, pathname, searchParams])

  const goTo = useCallback(
    (offset: number) => {
      if (!selected) return
      const idx = items.findIndex((m) => m.id === selected.id)
      if (idx === -1) return
      const target = items[(idx + offset + items.length) % items.length]
      const params = new URLSearchParams(searchParams.toString())
      params.set('media', target.id)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [selected, items, router, pathname, searchParams],
  )

  // Keyboard: Esc closes, ←/→ navigate.
  useEffect(() => {
    if (!selected) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowLeft') goTo(-1)
      else if (e.key === 'ArrowRight') goTo(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, close, goTo])

  // Lock body scroll while open.
  useEffect(() => {
    document.body.style.overflow = selected ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selected])

  if (!selected) return null

  const isReel = selected.platform === 'instagram'
  const portrait = mediaOrientation(selected.platform, selected.sourceUrl) === 'portrait'
  const hasSiblings = items.length > 1
  const PlatformIcon = isReel ? InstagramIcon : YoutubeIcon

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-6"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={selected.title}
    >
      {/* Close — offset clear of notches / Dynamic Island */}
      <button
        onClick={close}
        aria-label="Close"
        className="absolute right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] z-[75] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X size={20} />
      </button>

      {/* Prev / next */}
      {hasSiblings && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goTo(-1) }}
            aria-label="Previous"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-[75] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goTo(1) }}
            aria-label="Next"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-[75] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <div
        className={[
          'flex max-h-[92dvh] flex-col overflow-hidden rounded-2xl bg-[var(--surface)] shadow-2xl',
          // Portrait (reels & shorts): cap the player height so a 9:16 video
          // never exceeds the viewport — width is derived from height so it fits.
          portrait ? 'w-[min(92vw,calc(68dvh*9/16),420px)]' : 'w-full max-w-[min(92vw,880px)]',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Player */}
        <div className={`relative w-full shrink-0 bg-black ${portrait ? 'aspect-[9/16]' : 'aspect-video'}`}>
          {isReel ? (
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
          )}
        </div>

        {/* Meta */}
        <div className="flex min-h-0 flex-col gap-2 overflow-y-auto p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-bold leading-snug text-[var(--foreground)]">{selected.title}</h2>
            <a
              href={permalinkFor(selected.platform, selected.embedId)}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">Open on {isReel ? 'Instagram' : 'YouTube'}</span>
            </a>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <PlatformIcon size={13} />
            <span>{isReel ? 'Instagram Reel' : 'YouTube Video'}</span>
            {selected.categoryName && (
              <>
                <span aria-hidden>·</span>
                <span>{selected.categoryName}</span>
              </>
            )}
            {selected.date && (
              <>
                <span aria-hidden>·</span>
                <span suppressHydrationWarning>{formatRelativeDate(selected.date)}</span>
              </>
            )}
          </div>
          {selected.description && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--muted)]">
              {selected.description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
