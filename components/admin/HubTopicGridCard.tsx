'use client'

import Link from 'next/link'
import { Pencil, Trash2, Eye, EyeOff, Check, FolderTree } from 'lucide-react'
import type { HubAdminTopicNode } from '@/lib/hub'

/**
 * A topic rendered as a card for the admin grid view: cover image (or an icon
 * placeholder), title, badges, category and parent path, a selection checkbox,
 * and inline publish / edit / delete actions.
 */
export function HubTopicGridCard({
  node,
  parentTitle,
  selected,
  onToggleSelect,
  onTogglePublished,
  onDelete,
}: {
  node: HubAdminTopicNode
  parentTitle: string | null
  selected: boolean
  onToggleSelect: () => void
  onTogglePublished: () => void
  onDelete: () => void
}) {
  return (
    <div className={`group relative flex flex-col rounded-2xl border bg-[var(--surface)] overflow-hidden transition-colors ${selected ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : 'border-[var(--border)] hover:border-[var(--accent)]/50'}`}>
      {/* Selection checkbox (top-left) */}
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        aria-label={`Select ${node.title}`}
        onClick={onToggleSelect}
        className={`absolute top-2.5 left-2.5 z-10 tap-scale w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${selected ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--border)] bg-[var(--background)]/80 backdrop-blur hover:border-[var(--accent)]'}`}
      >
        {selected && <Check size={14} strokeWidth={3} />}
      </button>

      {/* Cover / thumbnail */}
      <Link href={`/admin/hub/${node.id}/edit`} className="block">
        <div className="relative aspect-[16/9] bg-[var(--background)] overflow-hidden">
          {node.coverImage ? (
            <div className="w-full h-full bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.03]" style={{ backgroundImage: `url(${node.coverImage})` }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              {node.icon ? <span>{node.icon}</span> : <FolderTree size={28} className="text-[var(--muted)]" />}
            </div>
          )}
          {!node.published && (
            <span className="absolute top-2.5 right-2.5 text-xs px-2 py-0.5 rounded-full bg-amber-500/90 text-white font-medium">Draft</span>
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="flex-1 flex flex-col p-3.5">
        {parentTitle && (
          <p className="text-[11px] text-[var(--muted)] truncate mb-0.5">in {parentTitle}</p>
        )}
        <Link href={`/admin/hub/${node.id}/edit`} className="font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors line-clamp-1">
          {node.title}
        </Link>

        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          {node.category && (
            <span className="text-[11px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: node.category.color || 'var(--accent)' }}>{node.category.name}</span>
          )}
          {node.childCount > 0 && <span className="text-[11px] text-[var(--muted)]">{node.childCount} sub</span>}
          {node.itemCount > 0 && <span className="text-[11px] text-[var(--muted)]">{node.itemCount} item{node.itemCount !== 1 ? 's' : ''}</span>}
        </div>

        {/* Actions */}
        <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-end gap-1">
          <button onClick={onTogglePublished} aria-label={node.published ? 'Unpublish' : 'Publish'} title={node.published ? 'Published' : 'Draft'} className="tap-scale p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)]">
            {node.published ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <Link href={`/admin/hub/${node.id}/edit`} aria-label="Edit" className="tap-scale p-1.5 rounded-lg text-[var(--accent)] hover:bg-[var(--background)]"><Pencil size={16} /></Link>
          <button onClick={onDelete} aria-label="Delete" className="tap-scale p-1.5 rounded-lg text-red-500 hover:bg-[var(--background)]"><Trash2 size={16} /></button>
        </div>
      </div>
    </div>
  )
}
