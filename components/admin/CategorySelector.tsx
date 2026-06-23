'use client'

import { useState, useEffect } from 'react'
import type { HubCategoryRef } from '@/lib/hub'

/**
 * Searchable, single-select category picker with inline "add new" (name +
 * colour). Self-fetches the category list so newly created ones appear without
 * a page refresh, and emits the full category ref (or null for "No category").
 * Used by both the topic form and the content-block editor.
 */
export default function CategorySelector({ value, onChange, initialCategories = [] }: {
  value: string
  onChange: (category: HubCategoryRef | null) => void
  initialCategories?: HubCategoryRef[]
}) {
  const [categories, setCategories] = useState<HubCategoryRef[]>(initialCategories)
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6366f1')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetch('/api/hub/categories')
      .then((r) => r.json())
      .then((data) => {
        if (active && Array.isArray(data)) {
          setCategories(data.map((c) => ({ id: c.id, name: c.name, slug: c.slug, color: c.color })))
        }
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  const filtered = search.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories

  async function handleCreate() {
    const name = newName.trim()
    if (!name) return
    // De-dupe: the API isn't idempotent, so if the name already exists just
    // select it instead of creating a duplicate.
    const existing = categories.find((c) => c.name.toLowerCase() === name.toLowerCase())
    if (existing) { onChange(existing); setNewName(''); setSearch(''); return }

    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/hub/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color: newColor }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Failed to add category')
        return
      }
      const cat = await res.json()
      const ref: HubCategoryRef = { id: cat.id, name: cat.name, slug: cat.slug, color: cat.color }
      setCategories((prev) => [...prev, ref].sort((a, b) => a.name.localeCompare(b.name)))
      onChange(ref)
      setNewName('')
      setSearch('')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-2.5">
      {categories.length > 4 && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories…"
          className="w-full h-10 px-3 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
        />
      )}

      <div className="flex flex-wrap gap-2">
        <Chip selected={!value} onClick={() => onChange(null)}>No category</Chip>
        {filtered.map((c) => (
          <Chip key={c.id} selected={value === c.id} color={c.color} onClick={() => onChange(c)}>{c.name}</Chip>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-[var(--muted)] py-1">No categories match &ldquo;{search}&rdquo;</p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          title="Category colour"
          aria-label="New category colour"
          className="h-10 w-10 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] cursor-pointer p-1"
        />
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate() } }}
          placeholder="New category name…"
          className="flex-1 h-10 px-3 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating || !newName.trim()}
          className="tap-scale px-3 h-10 text-sm rounded-xl border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] disabled:opacity-40 transition-colors font-medium"
        >
          {creating ? '…' : '+ Add'}
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function Chip({ selected, color, onClick, children }: { selected: boolean; color?: string | null; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`tap-scale inline-flex items-center gap-1.5 px-3 h-8 text-xs rounded-full border font-medium transition-colors ${
        selected && !color
          ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
          : selected
            ? 'text-white'
            : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]'
      }`}
      style={selected && color ? { backgroundColor: color, borderColor: color } : undefined}
    >
      {color && !selected && <span className="w-2 h-2 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  )
}
