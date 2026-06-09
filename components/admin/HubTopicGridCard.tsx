'use client'

import Link from 'next/link'
import { Pencil, Trash2, Eye, EyeOff, Check } from 'lucide-react'
import type { HubAdminTopicNode } from '@/lib/hub'

/**
 * A topic as a clean, compact card for the admin grid view — icon, title, parent
 * path, category + counts, a selection checkbox and inline publish/edit/delete.
 * No cover imagery.
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
  const meta: string[] = []
  if (node.childCount > 0) meta.push(`${node.childCount} sub`)
  if (node.itemCount > 0) meta.push(`${node.itemCount} item${node.itemCount === 1 ? '' : 's'}`)

  return (
    <div className={`relative flex flex-col rounded-2xl border bg-[var(--surface)] p-3.5 transition-colors ${selected ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : 'border-[var(--border)] hover:border-[var(--accent)]/50'}`}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={selected}
          aria-label={`Select ${node.title}`}
          onClick={onToggleSelect}
          className={`shrink-0 mt-0.5 tap-scale w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selected ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--border)] hover:border-[var(--accent)] bg-[var(--background)]'}`}
        >
          {selected && <Check size={13} strokeWidth={3} />}
        </button>

        <span className="shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] text-lg font-semibold">
          {node.icon || (node.title[0]?.toUpperCase() ?? '?')}
        </span>

        <div className="min-w-0 flex-1">
          {parentTitle && <p className="text-[11px] text-[var(--muted)] truncate">in {parentTitle}</p>}
          <Link href={`/admin/hub/${node.id}/edit`} className="block font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors line-clamp-1">
            {node.title}
          </Link>
          <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[11px] text-[var(--muted)]">
            {node.category && (
              <span className="px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: node.category.color || 'var(--accent)' }}>{node.category.name}</span>
            )}
            {!node.published && <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600">Draft</span>}
            {meta.length > 0 && <span>{meta.join(' · ')}</span>}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-end gap-1">
        <button onClick={onTogglePublished} aria-label={node.published ? 'Unpublish' : 'Publish'} title={node.published ? 'Published' : 'Draft'} className="tap-scale p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)]">
          {node.published ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        <Link href={`/admin/hub/${node.id}/edit`} aria-label="Edit" className="tap-scale p-1.5 rounded-lg text-[var(--accent)] hover:bg-[var(--background)]"><Pencil size={16} /></Link>
        <button onClick={onDelete} aria-label="Delete" className="tap-scale p-1.5 rounded-lg text-red-500 hover:bg-[var(--background)]"><Trash2 size={16} /></button>
      </div>
    </div>
  )
}
