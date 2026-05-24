'use client'

import { useState, useEffect } from 'react'

type Tag = { id: string; name: string; slug: string }

type Props = {
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export default function TagSelector({ selectedIds, onChange }: Props) {
  const [tags, setTags] = useState<Tag[]>([])
  const [newTag, setNewTag] = useState('')
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch('/api/tags').then((r) => r.json()).then(setTags)
  }, [])

  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
  }

  async function handleCreate() {
    if (!newTag.trim()) return
    setCreating(true)
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTag.trim() }),
    })
    setCreating(false)
    if (res.ok) {
      const tag: Tag = await res.json()
      setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)))
      onChange([...selectedIds, tag.id])
      setNewTag('')
    }
  }

  const filtered = search.trim()
    ? tags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : tags

  return (
    <div className="space-y-3">
      {tags.length > 0 && (
        <>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tags…"
            className="w-full h-10 px-3 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
          />
          <div className="flex flex-wrap gap-2">
            {filtered.length > 0 ? filtered.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggle(tag.id)}
                className={`tap-scale px-3 h-8 text-xs rounded-full border transition-colors font-medium ${
                  selectedIds.includes(tag.id)
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                    : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]'
                }`}
              >
                {tag.name}
              </button>
            )) : (
              <p className="text-xs text-[var(--muted)]">No tags match &ldquo;{search}&rdquo;</p>
            )}
          </div>
        </>
      )}
      <div className="flex gap-2">
        <input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate() } }}
          placeholder="New tag name…"
          className="flex-1 h-10 px-3 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating || !newTag.trim()}
          className="tap-scale px-3 h-10 text-sm rounded-xl border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] disabled:opacity-40 transition-colors font-medium"
        >
          {creating ? '…' : '+ Add'}
        </button>
      </div>
    </div>
  )
}
