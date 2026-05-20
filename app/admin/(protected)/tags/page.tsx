'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Tag = {
  id: string
  name: string
  slug: string
  _count: { posts: number; projects: number }
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
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

  useEffect(() => { loadTags() }, [])

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
    if (!confirm(`Delete tag "${name}"? It will be removed from all posts and projects.`)) return
    await fetch(`/api/tags/${id}`, { method: 'DELETE' })
    loadTags()
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] px-6 h-14 flex items-center gap-3">
        <Link href="/admin" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">← Admin</Link>
        <span className="text-[var(--border)]">/</span>
        <h1 className="font-semibold text-[var(--foreground)]">Tags</h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New tag name…"
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {creating ? 'Creating…' : 'Create tag'}
          </button>
        </form>
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {loading ? (
          <p className="text-[var(--muted)] text-sm">Loading…</p>
        ) : tags.length === 0 ? (
          <p className="text-[var(--muted)] text-sm">No tags yet.</p>
        ) : (
          <ul className="space-y-2">
            {tags.map((tag) => (
              <li key={tag.id} className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                {editId === tag.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRename(tag.id); if (e.key === 'Escape') setEditId(null) }}
                      autoFocus
                      className="flex-1 px-2 py-1 text-sm rounded border border-[var(--accent)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none"
                    />
                    <button onClick={() => handleRename(tag.id)} className="text-xs text-[var(--accent)] hover:underline">Save</button>
                    <button onClick={() => setEditId(null)} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]">Cancel</button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-[var(--foreground)] font-medium">{tag.name}</span>
                    <span className="text-xs text-[var(--muted)]">{tag._count.posts} post{tag._count.posts !== 1 ? 's' : ''}</span>
                    <span className="text-xs text-[var(--muted)]">{tag._count.projects} project{tag._count.projects !== 1 ? 's' : ''}</span>
                    <button
                      onClick={() => { setEditId(tag.id); setEditName(tag.name) }}
                      className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id, tag.name)}
                      className="text-xs text-[var(--muted)] hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
