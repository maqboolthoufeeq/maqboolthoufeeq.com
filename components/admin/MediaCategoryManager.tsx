'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Check, X, FolderOpen, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react'

type Category = {
  id: string
  name: string
  slug: string
  order: number
  _count: { items: number }
}

export default function MediaCategoryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  async function load() {
    const res = await fetch('/api/media-categories')
    const data = await res.json()
    setCategories(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError('')
    const res = await fetch('/api/media-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    setCreating(false)
    if (res.ok) { setNewName(''); load() }
    else { const d = await res.json(); setError(d.error ?? 'Failed to create topic') }
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return
    const res = await fetch(`/api/media-categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    })
    if (res.ok) { setEditId(null); setEditName(''); load() }
  }

  async function handleDelete(id: string, name: string, count: number) {
    const msg =
      count === 0
        ? `Delete topic “${name}”?`
        : `Delete topic “${name}”? Its ${count} item${count !== 1 ? 's' : ''} stay visible but move into the “More” row on the view-all pages.`
    if (!confirm(msg)) return
    await fetch(`/api/media-categories/${id}`, { method: 'DELETE' })
    load()
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= categories.length) return
    const next = [...categories]
    ;[next[index], next[target]] = [next[target], next[index]]
    setCategories(next)
    await Promise.all(
      next.map((c, i) =>
        fetch(`/api/media-categories/${c.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: i }),
        }),
      ),
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
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

      {loading ? (
        <p className="text-[var(--muted)] text-sm text-center py-8">Loading…</p>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] mb-3">
            <FolderOpen size={26} />
          </div>
          <p className="text-[var(--foreground)] font-medium">No topics yet</p>
          <p className="text-sm text-[var(--muted)] mt-1">
            Topics group your reels & videos into rows (like playlists) on the view-all pages.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {categories.map((cat, i) => (
            <li key={cat.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              {editId === cat.id ? (
                <div className="flex items-center gap-2 p-3">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(cat.id)
                      if (e.key === 'Escape') setEditId(null)
                    }}
                    autoFocus
                    className="flex-1 h-10 px-3 text-sm rounded-xl border border-[var(--accent)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none"
                  />
                  <button onClick={() => handleRename(cat.id)} aria-label="Save" className="tap-scale w-10 h-10 flex items-center justify-center rounded-full bg-[var(--accent)] text-white">
                    <Check size={18} />
                  </button>
                  <button onClick={() => setEditId(null)} aria-label="Cancel" className="tap-scale w-10 h-10 flex items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--background)]">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 px-3 py-3">
                    <div className="flex flex-col">
                      <button
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        aria-label="Move up"
                        className="text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-20 h-5 flex items-center"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => move(i, 1)}
                        disabled={i === categories.length - 1}
                        aria-label="Move down"
                        className="text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-20 h-5 flex items-center"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                    <Link
                      href={`/admin/media/categories/${cat.id}`}
                      className="row-pressable flex flex-1 items-center gap-3 min-w-0 rounded-lg -my-1 py-1"
                    >
                      <span className="shrink-0 w-10 h-10 rounded-xl bg-[var(--background)] flex items-center justify-center text-[var(--accent)]">
                        <FolderOpen size={18} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[var(--foreground)] truncate">{cat.name}</p>
                        <p className="text-xs text-[var(--muted)] truncate mt-0.5">
                          {cat._count.items} item{cat._count.items !== 1 ? 's' : ''} · view
                        </p>
                      </div>
                      <ChevronRight size={18} className="shrink-0 text-[var(--muted)]" />
                    </Link>
                  </div>
                  <div className="flex border-t border-[var(--border)] divide-x divide-[var(--border)]">
                    <button
                      onClick={() => { setEditId(cat.id); setEditName(cat.name) }}
                      className="row-pressable flex-1 h-11 flex items-center justify-center gap-1.5 text-sm font-medium text-[var(--accent)]"
                    >
                      <Pencil size={15} /> Rename
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name, cat._count.items)}
                      className="row-pressable flex-1 h-11 flex items-center justify-center gap-1.5 text-sm font-medium text-red-500"
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
