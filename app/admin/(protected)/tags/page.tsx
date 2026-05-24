'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Tags as TagsIcon, Check, X, Search } from 'lucide-react'
import AdminShell from '@/components/admin/AdminShell'

type Tag = {
  id: string
  name: string
  slug: string
  _count: { posts: number; projects: number }
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  async function loadTags() {
    const res = await fetch('/api/tags')
    const data = await res.json()
    setTags(data)
    setLoading(false)
  }

  useEffect(() => {
    loadTags()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError('')
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    setCreating(false)
    if (res.ok) {
      setNewName('')
      loadTags()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Failed to create tag')
    }
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return
    const res = await fetch(`/api/tags/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    })
    if (res.ok) {
      setEditId(null)
      setEditName('')
      loadTags()
    }
  }

  async function handleDelete(id: string, name: string) {
    if (
      !confirm(
        `Delete tag "${name}"? It will be removed from all posts and projects.`,
      )
    )
      return
    await fetch(`/api/tags/${id}`, { method: 'DELETE' })
    loadTags()
  }

  const filtered = tags.filter(
    (t) => !query.trim() || t.name.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <AdminShell title="Tags" back="/admin">
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Create form */}
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New tag name…"
            className="flex-1 h-11 px-3 text-sm rounded-2xl sm:rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="tap-scale h-11 px-4 text-sm bg-[var(--accent)] text-white rounded-2xl sm:rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity inline-flex items-center gap-1.5 font-medium"
          >
            <Plus size={16} strokeWidth={2.4} />
            <span className="hidden sm:inline">{creating ? 'Creating…' : 'Add'}</span>
          </button>
        </form>
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {loading ? (
          <p className="text-[var(--muted)] text-sm text-center py-8">Loading…</p>
        ) : tags.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] mb-3">
              <TagsIcon size={26} />
            </div>
            <p className="text-[var(--foreground)] font-medium">No tags yet</p>
            <p className="text-sm text-[var(--muted)] mt-1">
              Create your first tag using the form above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tags…"
                className="w-full h-11 pl-9 pr-3 text-sm rounded-2xl sm:rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            {filtered.length === 0 ? (
              <p className="text-[var(--muted)] text-sm text-center py-8">
                No tags match &ldquo;{query}&rdquo;.
              </p>
            ) : (
              <ul className="space-y-2">
                {filtered.map((tag) => (
                  <li
                    key={tag.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
                  >
                    {editId === tag.id ? (
                      <div className="flex items-center gap-2 p-3">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(tag.id)
                            if (e.key === 'Escape') setEditId(null)
                          }}
                          autoFocus
                          className="flex-1 h-10 px-3 text-sm rounded-xl border border-[var(--accent)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none"
                        />
                        <button
                          onClick={() => handleRename(tag.id)}
                          aria-label="Save"
                          className="tap-scale w-10 h-10 flex items-center justify-center rounded-full bg-[var(--accent)] text-white"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          aria-label="Cancel"
                          className="tap-scale w-10 h-10 flex items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--background)]"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 px-4 py-3">
                          <span className="shrink-0 w-10 h-10 rounded-xl bg-[var(--background)] flex items-center justify-center text-[var(--accent)]">
                            <TagsIcon size={18} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[var(--foreground)] truncate">
                              {tag.name}
                            </p>
                            <p className="text-xs text-[var(--muted)] truncate mt-0.5">
                              {tag._count.posts} post{tag._count.posts !== 1 ? 's' : ''}
                              {' · '}
                              {tag._count.projects} project
                              {tag._count.projects !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex border-t border-[var(--border)] divide-x divide-[var(--border)]">
                          <button
                            onClick={() => {
                              setEditId(tag.id)
                              setEditName(tag.name)
                            }}
                            className="row-pressable flex-1 h-11 flex items-center justify-center gap-1.5 text-sm font-medium text-[var(--accent)]"
                          >
                            <Pencil size={15} />
                            Rename
                          </button>
                          <button
                            onClick={() => handleDelete(tag.id, tag.name)}
                            className="row-pressable flex-1 h-11 flex items-center justify-center gap-1.5 text-sm font-medium text-red-500"
                          >
                            <Trash2 size={15} />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
