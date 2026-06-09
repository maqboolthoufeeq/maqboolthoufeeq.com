'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, X } from 'lucide-react'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { useRouter } from 'next/navigation'
import type { HubCategoryRef } from '@/lib/hub'

export default function HubCategoryManager({ initial }: { initial: HubCategoryRef[] }) {
  const router = useRouter()
  const [categories, setCategories] = useState(initial)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#3b82f6')
  const [creating, setCreating] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/hub/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      })
      if (res.ok) {
        const cat = await res.json()
        setCategories((prev) => [...prev, cat])
        setNewName('')
        setNewColor('#3b82f6')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error ?? 'Failed to create category')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setCreating(false)
    }
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return
    const res = await fetch(`/api/hub/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), color: editColor }),
    })
    if (res.ok) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: editName.trim(), color: editColor } : c))
      )
      setEditId(null)
      router.refresh()
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= categories.length) return
    const next = [...categories]
    ;[next[index], next[target]] = [next[target], next[index]]
    setCategories(next)
    await Promise.all(
      next.map((c, i) =>
        fetch(`/api/hub/categories/${c.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: c.name, color: c.color, order: i }),
        })
      )
    )
    router.refresh()
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/hub/categories/${pendingDelete}`, { method: 'DELETE' })
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== pendingDelete))
        router.refresh()
      }
    } catch (err) {
      setError('Failed to delete category')
    } finally {
      setDeleting(false)
      setPendingDelete(null)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Category name (e.g. Design, Development)…"
          className="flex-1 h-11 px-3 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
        />
        <label className="h-11 w-11 rounded-xl border border-[var(--border)] overflow-hidden cursor-pointer flex items-center justify-center">
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="w-full h-full cursor-pointer"
          />
        </label>
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="tap-scale h-11 px-4 text-sm bg-[var(--accent)] text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity inline-flex items-center gap-1.5 font-medium whitespace-nowrap"
        >
          <Plus size={16} strokeWidth={2.4} />
          <span className="hidden sm:inline">{creating ? 'Adding…' : 'Add'}</span>
        </button>
      </form>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {categories.length === 0 ? (
        <div className="text-center py-12 px-4">
          <p className="text-[var(--muted)] text-sm">No categories yet. Create one to organize your hub topics.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {categories.map((cat, i) => (
            <li
              key={cat.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
            >
              {editId === cat.id ? (
                <div className="flex items-center gap-2 p-3">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRename(cat.id); if (e.key === 'Escape') setEditId(null) }}
                    autoFocus
                    className="flex-1 h-10 px-3 text-sm rounded-lg border border-[var(--accent)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none"
                  />
                  <label className="h-10 w-10 rounded-lg border border-[var(--border)] overflow-hidden cursor-pointer flex items-center justify-center">
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="w-full h-full cursor-pointer"
                    />
                  </label>
                  <button
                    onClick={() => handleRename(cat.id)}
                    aria-label="Save"
                    className="tap-scale w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--accent)] text-white"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    aria-label="Cancel"
                    className="tap-scale w-9 h-9 flex items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--background)]"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-3 py-3">
                  <div className="flex flex-col gap-1">
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
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ background: cat.color || '#999' }}
                        aria-label={`Color: ${cat.color || 'none'}`}
                      />
                      <p className="font-medium text-[var(--foreground)]">{cat.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditId(cat.id)
                      setEditName(cat.name)
                      setEditColor(cat.color || '#3b82f6')
                    }}
                    aria-label="Edit"
                    className="tap-scale h-9 w-9 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setPendingDelete(cat.id)}
                    aria-label="Delete"
                    className="tap-scale h-9 w-9 flex items-center justify-center rounded-lg text-red-500 hover:bg-[var(--background)]"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        busy={deleting}
        title={`Delete "${categories.find((c) => c.id === pendingDelete)?.name || ''}"?`}
        message="This category will be deleted. Hub topics using it will be unaffected."
        confirmLabel="Delete category"
        onConfirm={confirmDelete}
        onCancel={() => { if (!deleting) setPendingDelete(null) }}
      />
    </div>
  )
}
