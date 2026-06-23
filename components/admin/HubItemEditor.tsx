'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import {
  HUB_ITEM_TYPES, HUB_ITEM_META,
  sanitizeHubItem,
  type HubItemType,
} from '@/lib/hub-content'
import { sanitizePostHtml } from '@/lib/sanitize'
import type { HubItemData, HubCategoryRef } from '@/lib/hub'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import ItemCard, { type FormItem, getIconComponent } from './HubItemCard'

export default function HubItemEditor({
  topicId,
  initialItems,
  categories,
}: {
  topicId: string
  initialItems: HubItemData[]
  categories: HubCategoryRef[]
}) {
  const router = useRouter()
  const [items, setItems] = useState<FormItem[]>(initialItems)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [typePickerId, setTypePickerId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function saveItem(item: FormItem) {
    setError('')
    setSaving(item.id)

    // Validate required fields
    if (!item.title.trim()) {
      setError('Title is required')
      setSaving(null)
      return
    }

    // Sanitize per type
    const sanitized = sanitizeHubItem(
      {
        type: item.type,
        title: item.title,
        description: item.description,
        url: item.url,
        fileUrl: item.fileUrl,
        fileName: item.fileName,
        fileSize: item.fileSize,
        fileType: item.fileType,
        content: item.content,
        thumbnail: item.thumbnail,
        images: item.images,
      },
      item.type === 'richtext' ? sanitizePostHtml : undefined
    )

    if (!sanitized.ok) {
      setError(sanitized.error)
      setSaving(null)
      return
    }

    try {
      const tagIds = (item.tags ?? []).map((t) => t.id)
      const url = item.id.startsWith('local-')
        ? '/api/hub/items'
        : `/api/hub/items/${item.id}`
      const method = item.id.startsWith('local-') ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          type: item.type,
          title: item.title,
          description: item.description || null,
          url: item.url || null,
          fileUrl: item.fileUrl || null,
          fileName: item.fileName || null,
          fileSize: item.fileSize || null,
          fileType: item.fileType || null,
          content: item.content || null,
          thumbnail: item.thumbnail || null,
          images: item.images,
          categoryId: item.category?.id || null,
          published: item.published,
          showDate: !!item.date,
          displayDate: item.date || null,
          order: items.indexOf(item),
          tags: tagIds,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to save item')
        setSaving(null)
        return
      }

      const saved = await res.json()
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...saved, tags: (saved.tags ?? []) } : it))
      )
      router.refresh()
    } catch (err) {
      setError('Network error')
    } finally {
      setSaving(null)
    }
  }

  async function deleteItem(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/hub/items/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== id))
        router.refresh()
      }
    } finally {
      setDeleting(false)
      setPendingDelete(null)
    }
  }

  async function reorderItems(ordered: FormItem[]) {
    const ids = ordered.map((it) => it.id).filter((id) => !id.startsWith('local-'))
    if (ids.length === 0) return
    const res = await fetch('/api/hub/items/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    if (res.ok) router.refresh()
  }

  async function handleFileUpload(file: File, _itemId: string): Promise<{ url: string; name: string; size: number; type: string } | null> {
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/media/attachment', {
        method: 'POST',
        body: fd,
      })
      if (res.ok) {
        const data = await res.json()
        return { url: data.url, name: data.name, size: data.size, type: data.type }
      }
    } catch (err) {
      setError('Upload failed')
    }
    return null
  }

  function addNewItem(type: HubItemType) {
    const id = `local-${Date.now()}`
    const newItem: FormItem = {
      id,
      type,
      title: '',
      description: null,
      url: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      fileType: null,
      content: null,
      contentHtml: null,
      thumbnail: null,
      images: [],
      category: null,
      tags: [],
      date: null,
      sortDate: new Date().toISOString(),
      published: true,
    }
    setItems((prev) => [...prev, newItem])
    setExpandedId(id)
    setTypePickerId(null)
  }

  const deleteTarget = items.find((it) => it.id === pendingDelete)

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <p className="text-[var(--foreground)] font-medium">No content blocks yet</p>
          <p className="text-sm text-[var(--muted)] mt-1">Add a block to start building this topic&apos;s content.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={item.id}>
              <ItemCard
                item={item}
                index={idx}
                total={items.length}
                expanded={expandedId === item.id}
                onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                onUpdate={(updates) => {
                  setItems((prev) =>
                    prev.map((it) => (it.id === item.id ? { ...it, ...updates } : it))
                  )
                }}
                onSave={() => saveItem(item)}
                onDelete={() => setPendingDelete(item.id)}
                onMoveUp={() => {
                  if (idx === 0) return
                  const next = [...items]
                  ;[next[idx], next[idx - 1]] = [next[idx - 1], next[idx]]
                  setItems(next)
                  reorderItems(next)
                }}
                onMoveDown={() => {
                  if (idx === items.length - 1) return
                  const next = [...items]
                  ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
                  setItems(next)
                  reorderItems(next)
                }}
                isSaving={saving === item.id}
                categories={categories}
                onUploadFile={handleFileUpload}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Add block button */}
      {typePickerId === null ? (
        <button
          onClick={() => setTypePickerId('picker')}
          className="w-full h-11 rounded-xl border border-dashed border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] flex items-center justify-center gap-1.5 font-medium transition-colors"
        >
          <Plus size={16} strokeWidth={2.4} />
          Add block
        </button>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
          <p className="text-sm font-medium text-[var(--foreground)]">Choose a block type:</p>
          <div className="grid grid-cols-2 gap-2">
            {HUB_ITEM_TYPES.map((type) => {
              const meta = HUB_ITEM_META[type]
              return (
                <button
                  key={type}
                  onClick={() => addNewItem(type)}
                  className="tap-scale p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:border-[var(--accent)] hover:bg-[var(--surface)] text-left transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-[var(--accent)] mt-0.5 shrink-0">{getIconComponent(meta.icon, 16)}</span>
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">{meta.label}</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">{meta.hint}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          <button
            onClick={() => setTypePickerId(null)}
            className="w-full h-10 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--background)] transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        busy={deleting}
        title="Delete this block?"
        message={`"${deleteTarget?.title || ''}" will be permanently deleted.`}
        confirmLabel="Delete"
        onConfirm={() => { if (pendingDelete) deleteItem(pendingDelete) }}
        onCancel={() => { if (!deleting) setPendingDelete(null) }}
      />
    </div>
  )
}

