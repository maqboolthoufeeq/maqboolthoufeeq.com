'use client'

import Link from 'next/link'
import { Pencil, Trash2, Star, Eye, EyeOff, Film } from 'lucide-react'
import { type Platform, resolveThumbnail, youTubeThumbnail, mediaOrientation, aspectClassForOrientation } from '@/lib/social'
import { InstagramIcon, YoutubeIcon } from '@/components/social/icons'

export type MediaListItem = {
  id: string
  platform: Platform
  title: string
  embedId: string
  sourceUrl: string
  thumbnailUrl: string | null
  featured: boolean
  published: boolean
  order: number
  categoryId: string | null
  categoryName: string | null
}

export type MediaItemCardProps = {
  item: MediaListItem
  onFeatured: (i: MediaListItem) => void
  onPublished: (i: MediaListItem) => void
  onDelete: (i: MediaListItem) => void
  /** Page to return to after editing — so Back goes where you came from. */
  backTo?: string
  /** Extra footer action (e.g. remove-from-topic). */
  extraAction?: React.ReactNode
  dragHandle?: React.ReactNode
  setNodeRef?: (el: HTMLDivElement | null) => void
  style?: React.CSSProperties
}

/**
 * Visual admin tile for a reel / video: thumbnail (correct orientation),
 * platform badge, a tappable featured star, and footer quick-actions
 * (hide/show, edit, delete, plus any caller-supplied extra action).
 */
export default function MediaItemCard({
  item, onFeatured, onPublished, onDelete, backTo = '/admin/media', extraAction, dragHandle, setNodeRef, style,
}: MediaItemCardProps) {
  const orientation = mediaOrientation(item.platform, item.sourceUrl)
  const thumb = resolveThumbnail(item.platform, item.embedId, item.thumbnailUrl, 'maxres')
  const PlatformIcon = item.platform === 'instagram' ? InstagramIcon : YoutubeIcon
  const editHref = `/admin/media/${item.id}/edit?from=${encodeURIComponent(backTo)}`

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col ${item.published ? '' : 'opacity-75'}`}
    >
      <Link href={editHref} className={`relative block w-full bg-black ${aspectClassForOrientation(orientation)}`}>
        {thumb ? (
          <img
            src={thumb}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => { if (item.platform === 'youtube') (e.currentTarget as HTMLImageElement).src = youTubeThumbnail(item.embedId, 'hq') }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/40"><Film size={24} /></div>
        )}
        <span className="absolute left-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
          <PlatformIcon size={12} />
        </span>
        {!item.published && (
          <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] font-semibold text-center py-1 inline-flex items-center justify-center gap-1">
            <EyeOff size={11} /> Hidden
          </span>
        )}
      </Link>

      <button
        type="button"
        onClick={() => onFeatured(item)}
        aria-label={item.featured ? 'Unfeature' : 'Feature'}
        title={item.featured ? 'Featured — tap to unfeature' : 'Tap to feature'}
        className={[
          'tap-scale absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-sm transition-colors',
          item.featured ? 'bg-[var(--accent)] text-white' : 'bg-black/45 text-white/80 hover:bg-black/70',
        ].join(' ')}
      >
        <Star size={13} className={item.featured ? 'fill-current' : ''} />
      </button>

      {dragHandle}

      <div className="p-2.5 flex flex-col gap-1.5 flex-1">
        <Link href={editHref} className="text-sm font-medium text-[var(--foreground)] leading-snug line-clamp-2 hover:text-[var(--accent)]">
          {item.title}
        </Link>
        {item.categoryName && (
          <span className="inline-flex w-fit items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--background)] border border-[var(--border)] text-[var(--muted)]">
            {item.categoryName}
          </span>
        )}
        <div className="mt-auto flex items-center justify-between pt-1.5 border-t border-[var(--border)]">
          <div className="flex items-center gap-0.5 -ml-1">
            <button onClick={() => onPublished(item)} aria-label={item.published ? 'Hide' : 'Show'} title={item.published ? 'Visible — tap to hide' : 'Hidden — tap to show'} className="tap-scale p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)]">
              {item.published ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
            {extraAction}
          </div>
          <div className="flex items-center gap-0.5">
            <Link href={editHref} aria-label="Edit" className="tap-scale p-1.5 rounded-lg text-[var(--accent)] hover:bg-[var(--background)]">
              <Pencil size={15} />
            </Link>
            <button onClick={() => onDelete(item)} aria-label="Delete" className="tap-scale p-1.5 -mr-1 rounded-lg text-red-500 hover:bg-[var(--background)]">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
