'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Plus, Pencil, Trash2, Check, X, FolderOpen, ChevronUp, ChevronDown, ChevronRight,
  List, LayoutGrid, ListChecks, Film,
} from 'lucide-react'
import { type Platform, resolveThumbnail, youTubeThumbnail } from '@/lib/social'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

type CatItem = { id: string; platform: Platform; embedId: string; thumbnailUrl: string | null; sourceUrl: string }
type Category = {
  id: string
  name: string
  slug: string
  order: number
  _count: { items: number }
  items: CatItem[]
}

type View = 'list' | 'grid'
const VIEW_KEY = 'admin-topics-view'

export default function MediaCategoryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')
  const [view, setView] = useState<View>('list')
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pendingDelete, setPendingDelete] = useState<{ ids: string[]; cascade: boolean } | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(VIEW_KEY)
    if (saved === 'list' || saved === 'grid') setView(saved)
  }, [])
  function chooseView(v: View) {
    setView(v)
    try { localStorage.setItem(VIEW_KEY, v) } catch { /* ignore */ }
  }

  async function load() {
    const res = await fetch('/api/media-categories')
    setCategories(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true); setError('')
    const res = await fetch('/api/media-categories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim() }),
    })
    setCreating(false)
    if (res.ok) { setNewName(''); load() }
    else { const d = await res.json(); setError(d.error ?? 'Failed to create topic') }
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return
    const res = await fetch(`/api/media-categories/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editName.trim() }),
    })
    if (res.ok) { setEditId(null); setEditName(''); load() }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= categories.length) return
    const next = [...categories]
    ;[next[index], next[target]] = [next[target], next[index]]
    setCategories(next)
    await Promise.all(
      next.map((c, i) => fetch(`/api/media-categories/${c.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: i }),
      })),
    )
  }

  // ── Selection + delete ──────────────────────────────────────────────────────
  function exitSelect() { setSelectMode(false); setSelected(new Set()) }
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  const allSelected = categories.length > 0 && categories.every((c) => selected.has(c.id))
  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(categories.map((c) => c.id)))
  }
  async function confirmDelete() {
    const p = pendingDelete
    if (!p?.ids.length) return
    setDeleting(true)
    try {
      const res = await Promise.all(p.ids.map((id) =>
        fetch(`/api/media-categories/${id}${p.cascade ? '?withItems=1' : ''}`, { method: 'DELETE' })))
      // fetch resolves even on 4xx/5xx — surface a failure instead of silently desyncing.
      if (res.some((r) => !r.ok)) throw new Error('delete-failed')
      if (selectMode) exitSelect()
    } catch {
      alert('Some topics couldn’t be deleted. Please try again.')
    } finally {
      setDeleting(false)
      setPendingDelete(null)
      await load() // re-sync from server in either case
    }
  }

  const pendingCats = pendingDelete ? categories.filter((c) => pendingDelete.ids.includes(c.id)) : []
  const pendingVideoCount = pendingCats.reduce((sum, c) => sum + c._count.items, 0)

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Create */}
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New topic name… (e.g. Travel, Tutorials)"
          className="flex-1 h-11 px-3 text-sm rounded-2xl sm:rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="tap-scale h-11 px-4 text-sm bg-[var(--accent)] text-white rounded-2xl sm:rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity inline-flex items-center gap-1.5 font-medium"
        >
          <Plus size={16} strokeWidth={2.4} />
          <span className="hidden sm:inline">{creating ? 'Adding…' : 'Add'}</span>
        </button>
      </form>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Toolbar: select + view */}
      {categories.length > 0 && (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}
            className={[
              'tap-scale inline-flex h-8 px-2.5 items-center gap-1.5 rounded-lg border text-xs font-medium transition-colors',
              selectMode ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]',
            ].join(' ')}
          >
            <ListChecks size={15} /> Select
          </button>
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            {([['list', List], ['grid', LayoutGrid]] as const).map(([v, Icon]) => (
              <button
                key={v}
                type="button"
                onClick={() => chooseView(v)}
                aria-label={`${v} view`}
                className={[
                  'tap-scale inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                  view === v ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-[var(--foreground)]',
                ].join(' ')}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-[var(--muted)] text-sm text-center py-8">Loading…</p>
      ) : categories.length === 0 ? (
        <EmptyState />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <TopicCard
              key={cat.id}
              cat={cat}
              selectMode={selectMode}
              selected={selected.has(cat.id)}
              onToggleSelect={() => toggleSelect(cat.id)}
              onRename={() => { setEditId(cat.id); setEditName(cat.name) }}
              onDelete={() => setPendingDelete({ ids: [cat.id], cascade: false })}
              editing={editId === cat.id}
              editName={editName}
              setEditName={setEditName}
              onRenameSave={() => handleRename(cat.id)}
              onRenameCancel={() => setEditId(null)}
            />
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {categories.map((cat, i) => (
            <TopicRow
              key={cat.id}
              cat={cat}
              index={i}
              total={categories.length}
              selectMode={selectMode}
              selected={selected.has(cat.id)}
              onToggleSelect={() => toggleSelect(cat.id)}
              onMove={move}
              onRename={() => { setEditId(cat.id); setEditName(cat.name) }}
              onDelete={() => setPendingDelete({ ids: [cat.id], cascade: false })}
              editing={editId === cat.id}
              editName={editName}
              setEditName={setEditName}
              onRenameSave={() => handleRename(cat.id)}
              onRenameCancel={() => setEditId(null)}
            />
          ))}
        </ul>
      )}

      {/* Bulk bar */}
      {selectMode && (
        <div className="sticky bottom-3 z-30">
          <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl px-3 py-2 shadow-xl">
            <button type="button" onClick={toggleSelectAll} className="tap-scale text-xs font-medium text-[var(--accent)] px-1">
              {allSelected ? 'Clear' : 'Select all'}
            </button>
            <span className="text-sm text-[var(--foreground)] flex-1 text-center tabular-nums">{selected.size} selected</span>
            <button
              type="button"
              onClick={() => setPendingDelete({ ids: [...selected], cascade: true })}
              disabled={selected.size === 0}
              className="tap-scale inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-40"
            >
              <Trash2 size={15} /> Delete
            </button>
            <button type="button" onClick={exitSelect} aria-label="Cancel selection" className="tap-scale h-9 w-9 inline-flex items-center justify-center rounded-xl text-[var(--muted)] hover:bg-[var(--background)]">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        busy={deleting}
        title={
          pendingDelete?.cascade
            ? `Delete ${pendingCats.length} topic${pendingCats.length !== 1 ? 's' : ''} & ${pendingVideoCount} item${pendingVideoCount !== 1 ? 's' : ''}?`
            : `Delete topic “${pendingCats[0]?.name ?? ''}”?`
        }
        message={
          pendingDelete?.cascade
            ? pendingVideoCount === 0
              ? `This permanently deletes ${pendingCats.length === 1 ? 'this topic' : 'these topics'} (no reels/videos inside). This can’t be undone.`
              : `This permanently deletes ${pendingCats.length === 1 ? 'this topic' : 'these topics'} and all ${pendingVideoCount} reel${pendingVideoCount !== 1 ? 's' : ''}/video${pendingVideoCount !== 1 ? 's' : ''} inside. This can’t be undone.`
            : pendingVideoCount === 0
              ? 'This deletes the topic only.'
              : `The topic is deleted; its ${pendingVideoCount} item${pendingVideoCount !== 1 ? 's' : ''} stay on your site and move into the “More” row.`
        }
        confirmLabel={pendingDelete?.cascade ? `Delete everything` : 'Delete topic'}
        onConfirm={confirmDelete}
        onCancel={() => { if (!deleting) setPendingDelete(null) }}
      />
    </div>
  )
}

// ── Thumbnail collage ─────────────────────────────────────────────────────────
function Thumb({ item }: { item: CatItem }) {
  const src = resolveThumbnail(item.platform, item.embedId, item.thumbnailUrl, 'maxres')
  return (
    <div className="relative bg-black">
      {src ? (
        <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => { if (item.platform === 'youtube') (e.currentTarget as HTMLImageElement).src = youTubeThumbnail(item.embedId, 'hq') }} />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-white/40"><Film size={16} /></span>
      )}
    </div>
  )
}
function Collage({ items }: { items: CatItem[] }) {
  const shown = items.slice(0, 4)
  if (shown.length === 0) {
    return <div className="absolute inset-0 flex items-center justify-center bg-[var(--background)] text-[var(--muted)]"><FolderOpen size={28} /></div>
  }
  return (
    <div className={`absolute inset-0 grid gap-px ${shown.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} ${shown.length > 2 ? 'grid-rows-2' : 'grid-rows-1'}`}>
      {shown.map((it) => <Thumb key={it.id} item={it} />)}
    </div>
  )
}

function SelectCheck({ selected, size = 'card' }: { selected: boolean; size?: 'card' | 'row' }) {
  return (
    <span aria-hidden className={[
      'inline-flex items-center justify-center rounded-full border-2 transition-colors',
      size === 'row' ? 'h-6 w-6' : 'h-7 w-7',
      selected ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-white/80 bg-black/30 text-transparent',
    ].join(' ')}>
      <Check size={size === 'row' ? 13 : 15} strokeWidth={3} />
    </span>
  )
}

type SharedProps = {
  cat: Category
  selectMode: boolean
  selected: boolean
  onToggleSelect: () => void
  onRename: () => void
  onDelete: () => void
  editing: boolean
  editName: string
  setEditName: (s: string) => void
  onRenameSave: () => void
  onRenameCancel: () => void
}

function RenameInline({ editName, setEditName, onSave, onCancel }: { editName: string; setEditName: (s: string) => void; onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2 p-2">
      <input
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
        autoFocus
        className="flex-1 h-10 px-3 text-sm rounded-xl border border-[var(--accent)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none"
      />
      <button onClick={onSave} aria-label="Save" className="tap-scale w-9 h-9 flex items-center justify-center rounded-full bg-[var(--accent)] text-white"><Check size={16} /></button>
      <button onClick={onCancel} aria-label="Cancel" className="tap-scale w-9 h-9 flex items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--background)]"><X size={16} /></button>
    </div>
  )
}

function TopicCard({ cat, selectMode, selected, onToggleSelect, onRename, onDelete, editing, editName, setEditName, onRenameSave, onRenameCancel }: SharedProps) {
  return (
    <div
      onClick={selectMode ? onToggleSelect : undefined}
      className={[
        'group relative rounded-2xl border bg-[var(--surface)] overflow-hidden',
        selectMode ? 'cursor-pointer select-none' : '',
        selected ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]' : 'border-[var(--border)]',
      ].join(' ')}
    >
      {editing ? (
        <RenameInline editName={editName} setEditName={setEditName} onSave={onRenameSave} onCancel={onRenameCancel} />
      ) : (
        <>
          <Link href={`/admin/media/categories/${cat.id}`} className={`relative block aspect-video ${selectMode ? 'pointer-events-none' : ''}`}>
            <Collage items={cat.items} />
            {selected && <span className="absolute inset-0 bg-[var(--accent)]/20" />}
          </Link>
          {selectMode && <span className="absolute right-2 top-2 z-10"><SelectCheck selected={selected} /></span>}
          <div className="p-2.5">
            <Link href={`/admin/media/categories/${cat.id}`} className={`block font-semibold text-sm text-[var(--foreground)] truncate hover:text-[var(--accent)] ${selectMode ? 'pointer-events-none' : ''}`}>
              {cat.name}
            </Link>
            <p className="text-xs text-[var(--muted)] mt-0.5">{cat._count.items} item{cat._count.items !== 1 ? 's' : ''}</p>
            {!selectMode && (
              <div className="mt-2 flex items-center gap-1 border-t border-[var(--border)] pt-2 -mx-0.5">
                <Link href={`/admin/media/categories/${cat.id}`} className="row-pressable flex-1 inline-flex items-center justify-center gap-1 h-8 rounded-lg text-xs font-medium text-[var(--accent)]"><ChevronRight size={14} /> Open</Link>
                <button onClick={onRename} aria-label="Rename" className="tap-scale h-8 w-8 inline-flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)]"><Pencil size={14} /></button>
                <button onClick={onDelete} aria-label="Delete" className="tap-scale h-8 w-8 inline-flex items-center justify-center rounded-lg text-red-500 hover:bg-[var(--background)]"><Trash2 size={14} /></button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function TopicRow({ cat, index, total, selectMode, selected, onToggleSelect, onMove, onRename, onDelete, editing, editName, setEditName, onRenameSave, onRenameCancel }: SharedProps & { index: number; total: number; onMove: (i: number, d: -1 | 1) => void }) {
  if (editing) {
    return <li className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"><RenameInline editName={editName} setEditName={setEditName} onSave={onRenameSave} onCancel={onRenameCancel} /></li>
  }
  return (
    <li
      onClick={selectMode ? onToggleSelect : undefined}
      className={[
        'rounded-2xl border bg-[var(--surface)] overflow-hidden',
        selectMode ? 'cursor-pointer select-none' : '',
        selected ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : 'border-[var(--border)]',
      ].join(' ')}
    >
      <div className="flex items-center gap-3 px-3 py-3">
        {selectMode ? (
          <span className="shrink-0"><SelectCheck selected={selected} size="row" /></span>
        ) : (
          <div className="flex flex-col">
            <button onClick={() => onMove(index, -1)} disabled={index === 0} aria-label="Move up" className="text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-20 h-5 flex items-center"><ChevronUp size={16} /></button>
            <button onClick={() => onMove(index, 1)} disabled={index === total - 1} aria-label="Move down" className="text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-20 h-5 flex items-center"><ChevronDown size={16} /></button>
          </div>
        )}
        <Link href={`/admin/media/categories/${cat.id}`} className={`row-pressable flex flex-1 items-center gap-3 min-w-0 rounded-lg -my-1 py-1 ${selectMode ? 'pointer-events-none' : ''}`}>
          <span className="relative shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-[var(--background)]"><Collage items={cat.items} /></span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--foreground)] truncate">{cat.name}</p>
            <p className="text-xs text-[var(--muted)] truncate mt-0.5">{cat._count.items} item{cat._count.items !== 1 ? 's' : ''} · view</p>
          </div>
          <ChevronRight size={18} className="shrink-0 text-[var(--muted)]" />
        </Link>
      </div>
      {!selectMode && (
        <div className="flex border-t border-[var(--border)] divide-x divide-[var(--border)]">
          <button onClick={onRename} className="row-pressable flex-1 h-11 flex items-center justify-center gap-1.5 text-sm font-medium text-[var(--accent)]"><Pencil size={15} /> Rename</button>
          <button onClick={onDelete} className="row-pressable flex-1 h-11 flex items-center justify-center gap-1.5 text-sm font-medium text-red-500"><Trash2 size={15} /> Delete</button>
        </div>
      )}
    </li>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] mb-3">
        <FolderOpen size={26} />
      </div>
      <p className="text-[var(--foreground)] font-medium">No topics yet</p>
      <p className="text-sm text-[var(--muted)] mt-1">Topics group your reels & videos into rows (like playlists) on the view-all pages.</p>
    </div>
  )
}
