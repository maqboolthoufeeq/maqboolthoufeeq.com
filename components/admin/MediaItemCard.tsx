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

export type MediaLayout = 'card' | 'list'

export type MediaItemCardProps = {
  item: MediaListItem
  onFeatured: (i: MediaListItem) => void
  onPublished: (i: MediaListItem) => void
  onDelete: (i: MediaListItem) => void
  /** Card grid (default) or compact list row. */
  layout?: MediaLayout
  /** Page to return to after editing — so Back goes where you came from. */
  backTo?: string
  /** Extra footer action (e.g. remove-from-topic). */
  extraAction?: React.ReactNode
  /** Neutral grip button (positioned by this component per layout). */
  dragHandle?: React.ReactNode
  setNodeRef?: (el: HTMLDivElement | null) => void
  style?: React.CSSProperties
}

/**
 * Visual admin tile for a reel / video. Renders as a thumbnail-forward card
 * (grid views) or a compact row (list view), with a platform badge, a tappable
 * featured star, and quick-actions (hide/show, edit, delete, extra).
 */
export default function MediaItemCard({
  item, onFeatured, onPublished, onDelete, layout = 'card', backTo = '/admin/media', extraAction, dragHandle, setNodeRef, style,
}: MediaItemCardProps) {
  const orientation = mediaOrientation(item.platform, item.sourceUrl)
  const thumb = resolveThumbnail(item.platform, item.embedId, item.thumbnailUrl, 'maxres')
  const PlatformIcon = item.platform === 'instagram' ? InstagramIcon : YoutubeIcon
  const editHref = `/admin/media/${item.id}/edit?from=${encodeURIComponent(backTo)}`

  const featureBtn = (
    <button
      type="button"
      onClick={() => onFeatured(item)}
      aria-label={item.featured ? 'Unfeature' : 'Feature'}
      title={item.featured ? 'Featured — tap to unfeature' : 'Tap to feature'}
      className={[
        'tap-scale inline-flex items-center justify-center rounded-full transition-colors',
        layout === 'list' ? 'h-8 w-8' : 'absolute right-2 top-2 z-10 h-7 w-7 backdrop-blur-sm',
        item.featured
          ? layout === 'list' ? 'text-[var(--accent)]' : 'bg-[var(--accent)] text-white'
          : layout === 'list' ? 'text-[var(--muted)] hover:text-[var(--foreground)]' : 'bg-black/45 text-white/80 hover:bg-black/70',
      ].join(' ')}
    >
      <Star size={layout === 'list' ? 15 : 13} className={item.featured ? 'fill-current' : ''} />
    </button>
  )
  const publishBtn = (
    <button onClick={() => onPublished(item)} aria-label={item.published ? 'Hide' : 'Show'} title={item.published ? 'Visible — tap to hide' : 'Hidden — tap to show'} className="tap-scale p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)]">
      {item.published ? <Eye size={15} /> : <EyeOff size={15} />}
    </button>
  )
  const editBtn = (
    <Link href={editHref} aria-label="Edit" className="tap-scale p-1.5 rounded-lg text-[var(--accent)] hover:bg-[var(--background)]">
      <Pencil size={15} />
    </Link>
  )
  const deleteBtn = (
    <button onClick={() => onDelete(item)} aria-label="Delete" className="tap-scale p-1.5 rounded-lg text-red-500 hover:bg-[var(--background)]">
      <Trash2 size={15} />
    </button>
  )

  // ── List row ──────────────────────────────────────────────────────────────
  if (layout === 'list') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-1 pr-2 py-1.5 ${item.published ? '' : 'opacity-75'}`}
      >
        {dragHandle && <span className="shrink-0 w-6 inline-flex items-center justify-center text-[var(--muted)]">{dragHandle}</span>}
        <Link href={editHref} className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-black">
          {thumb ? (
            <img src={thumb} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" onError={(e) => { if (item.platform === 'youtube') (e.currentTarget as HTMLImageElement).src = youTubeThumbnail(item.embedId, 'hq') }} />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-white/40"><Film size={18} /></span>
          )}
          <span className="absolute left-0.5 top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-black/55 text-white"><PlatformIcon size={9} /></span>
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={editHref} className="block text-sm font-medium text-[var(--foreground)] truncate hover:text-[var(--accent)]">{item.title}</Link>
          <div className="flex items-center gap-1.5 mt-0.5">
            {item.categoryName && <span className="text-[10px] text-[var(--muted)] truncate">{item.categoryName}</span>}
            {!item.published && <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--muted)]"><EyeOff size={10} /> Hidden</span>}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {featureBtn}
          {publishBtn}
          {extraAction}
          {editBtn}
          {deleteBtn}
        </div>
      </div>
    )
  }

  // ── Card ──────────────────────────────────────────────────────────────────
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col ${item.published ? '' : 'opacity-75'}`}
    >
      <Link href={editHref} className={`relative block w-full bg-black ${aspectClassForOrientation(orientation)}`}>
        {thumb ? (
          <img src={thumb} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" onError={(e) => { if (item.platform === 'youtube') (e.currentTarget as HTMLImageElement).src = youTubeThumbnail(item.embedId, 'hq') }} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/40"><Film size={24} /></div>
        )}
        <span className="absolute left-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"><PlatformIcon size={12} /></span>
        {!item.published && (
          <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] font-semibold text-center py-1 inline-flex items-center justify-center gap-1"><EyeOff size={11} /> Hidden</span>
        )}
      </Link>

      {featureBtn}
      {dragHandle && (
        <span className="absolute right-2 top-10 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white/80 backdrop-blur-sm hover:bg-black/70">{dragHandle}</span>
      )}

      <div className="p-2.5 flex flex-col gap-1.5 flex-1">
        <Link href={editHref} className="text-sm font-medium text-[var(--foreground)] leading-snug line-clamp-2 hover:text-[var(--accent)]">{item.title}</Link>
        {item.categoryName && (
          <span className="inline-flex w-fit items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--background)] border border-[var(--border)] text-[var(--muted)]">{item.categoryName}</span>
        )}
        <div className="mt-auto flex items-center justify-between pt-1.5 border-t border-[var(--border)]">
          <div className="flex items-center gap-0.5 -ml-1">
            {publishBtn}
            {extraAction}
          </div>
          <div className="flex items-center gap-0.5 -mr-1">
            {editBtn}
            {deleteBtn}
          </div>
        </div>
      </div>
    </div>
  )
}
