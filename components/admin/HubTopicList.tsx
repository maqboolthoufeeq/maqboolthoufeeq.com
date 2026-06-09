'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, Pencil, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, Settings,
  List as ListIcon, LayoutGrid, Check, X,
} from 'lucide-react'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import type { HubAdminTopicNode } from '@/lib/hub'
import { HubTopicGridCard } from './HubTopicGridCard'

const inputCls =
  'w-full h-11 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-sm'

type View = 'list' | 'grid'
type Confirm = { kind: 'single'; node: HubAdminTopicNode } | { kind: 'bulk'; ids: string[] } | null

export function flattenNodes(nodes: HubAdminTopicNode[]): HubAdminTopicNode[] {
  return nodes.flatMap((n) => [n, ...flattenNodes(n.children)])
}

/** Keep a topic when its title matches, or any descendant does (prunes branches). */
function filterTree(nodes: HubAdminTopicNode[], q: string): HubAdminTopicNode[] {
  const query = q.toLowerCase()
  return nodes
    .map((n) => ({ ...n, children: filterTree(n.children, q) }))
    .filter((n) => n.title.toLowerCase().includes(query) || n.children.length > 0)
}

export default function HubTopicList({ tree }: { tree: HubAdminTopicNode[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [busy, setBusy] = useState(false)

  // Persist the view preference (client-only to avoid hydration mismatch).
  useEffect(() => {
    const saved = localStorage.getItem('hub-admin-view')
    if (saved === 'grid' || saved === 'list') setView(saved)
  }, [])
  function changeView(v: View) { setView(v); localStorage.setItem('hub-admin-view', v) }

  const filtered = useMemo(() => (search ? filterTree(tree, search) : tree), [tree, search])
  const flat = useMemo(() => flattenNodes(filtered), [filtered])
  const parentTitle = useMemo(() => {
    const byId = new Map(flattenNodes(tree).map((n) => [n.id, n.title]))
    return (id: string | null) => (id ? byId.get(id) ?? null : null)
  }, [tree])

  // ── Selection ──────────────────────────────────────────────────────────────
  const allSelected = flat.length > 0 && flat.every((n) => selected.has(n.id))
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(flat.map((n) => n.id)))
  }
  const clearSelection = () => setSelected(new Set())

  // ── Mutations ────────────────────────────────────────────────────────────────
  async function setPublished(ids: string[], published: boolean) {
    setBusy(true)
    try {
      await Promise.all(ids.map((id) =>
        fetch(`/api/hub/topics/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ published }) })))
      router.refresh()
    } finally { setBusy(false) }
  }
  async function deleteIds(ids: string[]) {
    setBusy(true)
    try {
      await Promise.all(ids.map((id) => fetch(`/api/hub/topics/${id}`, { method: 'DELETE' })))
      router.refresh()
      clearSelection()
    } finally { setBusy(false); setConfirm(null) }
  }
  async function reorderSiblings(siblings: HubAdminTopicNode[], id: string, dir: -1 | 1) {
    const idx = siblings.findIndex((n) => n.id === id)
    const target = idx + dir
    if (idx === -1 || target < 0 || target >= siblings.length) return
    const ids = siblings.map((n) => n.id)
    ;[ids[idx], ids[target]] = [ids[target], ids[idx]]
    const res = await fetch('/api/hub/topics/reorder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) })
    if (res.ok) router.refresh()
  }

  const selectedCount = selected.size
  const confirmNodes = confirm?.kind === 'single' ? [confirm.node] : confirm?.kind === 'bulk' ? flat.filter((n) => confirm.ids.includes(n.id)) : []
  const confirmCascades = confirmNodes.some((n) => n.childCount > 0 || n.itemCount > 0)

  return (
    <div className="space-y-4 pb-24">
      {/* Header: search + view toggle + actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search topics…" className={inputCls} />
        <div className="shrink-0 flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] p-0.5">
          <ViewBtn active={view === 'list'} onClick={() => changeView('list')} label="List view"><ListIcon size={16} /></ViewBtn>
          <ViewBtn active={view === 'grid'} onClick={() => changeView('grid')} label="Grid view"><LayoutGrid size={16} /></ViewBtn>
        </div>
        <Link href="/admin/hub/new" className="tap-scale shrink-0 h-11 px-3 sm:px-4 bg-[var(--accent)] text-white rounded-xl hover:opacity-90 inline-flex items-center gap-1.5 font-medium whitespace-nowrap">
          <Plus size={16} strokeWidth={2.4} /><span className="hidden sm:inline">New topic</span>
        </Link>
        <Link href="/admin/hub/categories" aria-label="Manage categories" className="tap-scale shrink-0 h-11 w-11 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] flex items-center justify-center">
          <Settings size={18} />
        </Link>
      </div>

      {/* Select-all row (when there are topics) */}
      {flat.length > 0 && (
        <div className="flex items-center gap-2 px-1 text-xs text-[var(--muted)]">
          <Checkbox checked={allSelected} indeterminate={selectedCount > 0 && !allSelected} onChange={toggleSelectAll} label="Select all topics" />
          <span>{selectedCount > 0 ? `${selectedCount} selected` : `Select all (${flat.length})`}</span>
        </div>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 px-4">
          <p className="text-[var(--muted)] text-sm">{search ? 'No topics match your search.' : 'No topics yet. Create one to get started.'}</p>
        </div>
      ) : view === 'list' ? (
        <TopicTree nodes={filtered} selected={selected} onToggleSelect={toggleSelect}
          onReorder={reorderSiblings} onTogglePublished={(id, p) => setPublished([id], !p)} onDelete={(node) => setConfirm({ kind: 'single', node })} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {flat.map((node) => (
            <HubTopicGridCard key={node.id} node={node} parentTitle={parentTitle(node.parentId)} selected={selected.has(node.id)}
              onToggleSelect={() => toggleSelect(node.id)} onTogglePublished={() => setPublished([node.id], !node.published)} onDelete={() => setConfirm({ kind: 'single', node })} />
          ))}
        </div>
      )}

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pointer-events-none">
          <div className="pointer-events-auto mx-auto max-w-2xl flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl shadow-2xl px-2.5 py-2">
            <span className="text-sm font-semibold text-[var(--foreground)] px-1.5 whitespace-nowrap">{selectedCount} selected</span>
            <div className="flex-1" />
            <BulkBtn onClick={() => setPublished([...selected], true)} disabled={busy} label="Publish"><Eye size={15} /><span className="hidden sm:inline">Publish</span></BulkBtn>
            <BulkBtn onClick={() => setPublished([...selected], false)} disabled={busy} label="Unpublish"><EyeOff size={15} /><span className="hidden sm:inline">Unpublish</span></BulkBtn>
            <BulkBtn onClick={() => setConfirm({ kind: 'bulk', ids: [...selected] })} disabled={busy} label="Delete" danger><Trash2 size={15} /><span className="hidden sm:inline">Delete</span></BulkBtn>
            <button onClick={clearSelection} aria-label="Clear selection" className="tap-scale w-9 h-9 flex items-center justify-center rounded-xl text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]"><X size={17} /></button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        busy={busy}
        title={confirm?.kind === 'bulk' ? `Delete ${confirm.ids.length} topic${confirm.ids.length === 1 ? '' : 's'}?` : `Delete "${confirmNodes[0]?.title ?? ''}"?`}
        message={confirmCascades
          ? 'Selected topics include subtopics and/or content blocks — all of them will be permanently deleted too.'
          : confirm?.kind === 'bulk' ? 'These topics will be permanently deleted.' : 'This topic will be permanently deleted.'}
        confirmLabel={confirm?.kind === 'bulk' ? `Delete ${confirm.ids.length}` : 'Delete topic'}
        onConfirm={() => { if (confirm) deleteIds(confirm.kind === 'bulk' ? confirm.ids : [confirm.node.id]) }}
        onCancel={() => { if (!busy) setConfirm(null) }}
      />
    </div>
  )
}

/* ─── Shared bits ────────────────────────────────────────────────────────── */

export function Checkbox({ checked, indeterminate, onChange, label }: { checked: boolean; indeterminate?: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={indeterminate ? 'mixed' : checked} aria-label={label}
      onClick={(e) => { e.stopPropagation(); onChange() }}
      className={`tap-scale shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${checked || indeterminate ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--border)] hover:border-[var(--accent)] bg-[var(--background)]'}`}>
      {indeterminate ? <span className="w-2 h-0.5 bg-white rounded" /> : checked ? <Check size={13} strokeWidth={3} /> : null}
    </button>
  )
}

function ViewBtn({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} aria-pressed={active}
      className={`tap-scale w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${active ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}>
      {children}
    </button>
  )
}

function BulkBtn({ onClick, disabled, label, danger, children }: { onClick: () => void; disabled?: boolean; label: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label}
      className={`tap-scale h-9 px-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-1.5 disabled:opacity-50 transition-colors ${danger ? 'text-red-500 hover:bg-red-500/10' : 'text-[var(--foreground)] hover:bg-[var(--background)]'}`}>
      {children}
    </button>
  )
}

/* ─── List view tree ─────────────────────────────────────────────────────── */

function TopicTree({ nodes, selected, onToggleSelect, onReorder, onTogglePublished, onDelete, depth = 0 }: {
  nodes: HubAdminTopicNode[]
  selected: Set<string>
  onToggleSelect: (id: string) => void
  onReorder: (siblings: HubAdminTopicNode[], id: string, dir: -1 | 1) => void
  onTogglePublished: (id: string, published: boolean) => void
  onDelete: (node: HubAdminTopicNode) => void
  depth?: number
}) {
  return (
    <ul className="space-y-2">
      {nodes.map((node, idx) => (
        <li key={node.id}>
          <TopicRow node={node} depth={depth} index={idx} total={nodes.length} isSelected={selected.has(node.id)}
            onToggleSelect={() => onToggleSelect(node.id)} onReorder={(dir) => onReorder(nodes, node.id, dir)}
            onTogglePublished={() => onTogglePublished(node.id, node.published)} onDelete={() => onDelete(node)} />
          {node.children.length > 0 && (
            <div className="mt-2">
              <TopicTree nodes={node.children} selected={selected} onToggleSelect={onToggleSelect} onReorder={onReorder}
                onTogglePublished={onTogglePublished} onDelete={onDelete} depth={depth + 1} />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

function TopicRow({ node, depth, index, total, isSelected, onToggleSelect, onReorder, onTogglePublished, onDelete }: {
  node: HubAdminTopicNode; depth: number; index: number; total: number; isSelected: boolean
  onToggleSelect: () => void; onReorder: (dir: -1 | 1) => void; onTogglePublished: () => void; onDelete: () => void
}) {
  return (
    <div className={`rounded-xl border bg-[var(--surface)] overflow-hidden transition-colors ${isSelected ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : 'border-[var(--border)]'}`}
      style={{ marginLeft: depth > 0 ? `${Math.min(depth, 4) * 1}rem` : '0' }}>
      <div className="flex items-center gap-2.5 px-3 py-3">
        <Checkbox checked={isSelected} onChange={onToggleSelect} label={`Select ${node.title}`} />
        <div className="flex flex-col gap-1 shrink-0">
          <button onClick={onReorder.bind(null, -1)} disabled={index === 0} aria-label="Move up" className="text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-20 h-5 flex items-center"><ChevronUp size={16} /></button>
          <button onClick={onReorder.bind(null, 1)} disabled={index === total - 1} aria-label="Move down" className="text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-20 h-5 flex items-center"><ChevronDown size={16} /></button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-[var(--foreground)] truncate">{node.title}</p>
            {!node.published && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600">Draft</span>}
            {node.childCount > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">{node.childCount} sub</span>}
            {node.itemCount > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">{node.itemCount} item{node.itemCount !== 1 ? 's' : ''}</span>}
          </div>
          {node.category && <p className="text-xs text-[var(--muted)] mt-0.5">{node.category.name}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onTogglePublished} aria-label={node.published ? 'Unpublish' : 'Publish'} title={node.published ? 'Published' : 'Draft'} className="tap-scale p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)]">{node.published ? <Eye size={16} /> : <EyeOff size={16} />}</button>
          <Link href={`/admin/hub/${node.id}/edit`} aria-label="Edit" className="tap-scale p-1.5 rounded-lg text-[var(--accent)] hover:bg-[var(--background)]"><Pencil size={16} /></Link>
          <button onClick={onDelete} aria-label="Delete" className="tap-scale p-1.5 rounded-lg text-red-500 hover:bg-[var(--background)]"><Trash2 size={16} /></button>
        </div>
      </div>
    </div>
  )
}
