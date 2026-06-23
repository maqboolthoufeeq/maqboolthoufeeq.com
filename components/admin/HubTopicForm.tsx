'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react'
import Switch from '@/components/admin/Switch'
import TagSelector from '@/components/admin/TagSelector'
import HubItemEditor from '@/components/admin/HubItemEditor'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import type { HubTopicEditData, HubCategoryRef } from '@/lib/hub'
import { HUB_LIMITS } from '@/lib/hub-content'

const inputCls =
  'w-full h-11 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-sm'

export default function HubTopicForm({
  initial,
  topicOptions,
  categories,
  defaultParentId = null,
  onCreated,
}: {
  initial: HubTopicEditData | null
  topicOptions: { id: string; title: string; depth: number; parentId: string | null }[]
  categories: HubCategoryRef[]
  /** Preselect a parent when creating (used by the inline "add subtopic" modal). */
  defaultParentId?: string | null
  /** When creating, called with the new id instead of navigating to its edit page. */
  onCreated?: (id: string) => void
}) {
  const router = useRouter()
  const isCreating = !initial
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '')
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? '')
  const [parentId, setParentId] = useState(initial?.parentId ?? defaultParentId ?? '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [selectedTagIds, setSelectedTagIds] = useState(
    initial?.tags?.map((t) => t.id) ?? []
  )
  const [published, setPublished] = useState(initial?.published ?? true)
  const [showDate, setShowDate] = useState(initial?.showDate ?? false)
  // <input type="date"> needs a bare yyyy-MM-dd value, not a full ISO timestamp.
  const [displayDate, setDisplayDate] = useState((initial?.displayDate ?? '').slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const url = initial ? `/api/hub/topics/${initial.id}` : '/api/hub/topics'
      const method = initial ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          icon: icon.trim() || null,
          coverImage: coverImage.trim() || null,
          parentId: parentId || null,
          categoryId: categoryId || null,
          published,
          showDate,
          displayDate: showDate ? displayDate : null,
          tags: selectedTagIds,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to save topic')
        setSaving(false)
        return
      }

      const created = await res.json()
      setSaved(true)
      router.refresh()

      if (isCreating) {
        if (onCreated) onCreated(created.id)
        else router.push(`/admin/hub/${created.id}/edit`)
      } else {
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function handleUploadCover(file: File) {
    setUploadingCover(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/media/attachment', {
        method: 'POST',
        body: fd,
      })
      if (res.ok) {
        const data = await res.json()
        setCoverImage(data.url)
      } else {
        setError('Failed to upload cover image')
      }
    } catch (err) {
      setError('Upload failed')
    } finally {
      setUploadingCover(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/hub/topics/${initial?.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/admin/hub')
      } else {
        setError('Failed to delete topic')
      }
    } finally {
      setDeleting(false)
      setPendingDelete(false)
    }
  }

  // Filter out self and descendants from parent options
  const availableParents = topicOptions.filter((opt) => {
    if (initial && opt.id === initial.id) return false
    // TODO: filter out descendants when editing (would need the tree)
    return true
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm text-[var(--muted)] mb-1.5">Title *</label>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setSaved(false)
          }}
          placeholder="Topic title"
          maxLength={HUB_LIMITS.topicTitle}
          required
          className={inputCls}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm text-[var(--muted)] mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            setSaved(false)
          }}
          placeholder="Optional description of this topic"
          maxLength={HUB_LIMITS.description}
          rows={3}
          className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-sm resize-y"
        />
      </div>

      {/* Icon */}
      <div>
        <label className="block text-sm text-[var(--muted)] mb-1.5">Icon (emoji or text)</label>
        <input
          value={icon}
          onChange={(e) => {
            setIcon(e.target.value)
            setSaved(false)
          }}
          placeholder="🎨 or Design"
          maxLength={HUB_LIMITS.icon}
          className={inputCls}
        />
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-sm text-[var(--muted)] mb-1.5">Cover image</label>
        <div className="flex gap-2 items-stretch">
          <input
            value={coverImage}
            onChange={(e) => {
              setCoverImage(e.target.value)
              setSaved(false)
            }}
            placeholder="https://…"
            maxLength={HUB_LIMITS.url}
            className={`${inputCls} flex-1`}
          />
          <label className="tap-scale cursor-pointer px-3 h-11 text-sm border border-[var(--border)] rounded-xl text-[var(--muted)] flex items-center gap-1.5 hover:border-[var(--accent)] hover:text-[var(--foreground)] transition-colors whitespace-nowrap">
            <Upload size={15} />
            {uploadingCover ? '…' : 'Upload'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleUploadCover(f)
              }}
            />
          </label>
        </div>
        {coverImage && (
          <p className="text-xs text-green-500 mt-1">
            <CheckCircle2 size={12} className="inline mr-1" />
            Cover image set
          </p>
        )}
      </div>

      {/* Parent Topic */}
      <div>
        <label className="block text-sm text-[var(--muted)] mb-1.5">Parent topic</label>
        <select
          value={parentId}
          onChange={(e) => {
            setParentId(e.target.value)
            setSaved(false)
          }}
          className={inputCls}
        >
          <option value="">Root (no parent)</option>
          {availableParents.map((opt) => (
            <option key={opt.id} value={opt.id} style={{ paddingLeft: `${opt.depth * 1.5}em` }}>
              {'  '.repeat(opt.depth)}{opt.title}
            </option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm text-[var(--muted)] mb-1.5">Category</label>
        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value)
            setSaved(false)
          }}
          className={inputCls}
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm text-[var(--muted)] mb-1.5">Tags</label>
        <TagSelector
          selectedIds={selectedTagIds}
          onChange={(ids) => {
            setSelectedTagIds(ids)
            setSaved(false)
          }}
        />
      </div>

      {/* Published toggle */}
      <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--foreground)]">Published</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {published ? 'Visible on the public site' : 'Hidden — only you can see it'}
            </p>
          </div>
          <Switch
            checked={published}
            onChange={(v) => {
              setPublished(v)
              setSaved(false)
            }}
            label="Published"
          />
        </div>
      </div>

      {/* Date toggle + input */}
      <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--foreground)]">Show date</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {showDate ? 'Date is visible' : 'No date shown'}
            </p>
          </div>
          <Switch
            checked={showDate}
            onChange={(v) => {
              setShowDate(v)
              if (v && !displayDate) {
                setDisplayDate(new Date().toISOString().slice(0, 10))
              }
              setSaved(false)
            }}
            label="Show date"
          />
        </div>
        {showDate && (
          <div className="mt-3">
            <label className="block text-xs text-[var(--muted)] mb-1.5">Date</label>
            <input
              type="date"
              value={displayDate}
              onChange={(e) => {
                setDisplayDate(e.target.value)
                setSaved(false)
              }}
              max={new Date().toISOString().slice(0, 10)}
              className={`${inputCls} max-w-[200px]`}
            />
          </div>
        )}
      </div>

      {/* Content blocks section — only for editing */}
      {!isCreating && initial && (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-[var(--foreground)] mb-1">Content blocks</p>
            <p className="text-xs text-[var(--muted)]">Add images, text, videos, and more to this topic.</p>
          </div>
          <HubItemEditor
            topicId={initial.id}
            initialItems={initial.items}
            categories={categories}
          />
        </div>
      )}

      {isCreating && (
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-700 text-sm">
          <AlertCircle size={16} className="inline mr-1" />
          Save the topic first, then you can add content blocks.
        </div>
      )}

      {/* Save button */}
      <button
        type="submit"
        disabled={saving}
        className={`w-full h-12 rounded-2xl text-white font-semibold transition-all disabled:opacity-50 ${
          saved ? 'bg-green-600' : 'bg-[var(--accent)] hover:opacity-90'
        }`}
      >
        {saving ? 'Saving…' : saved ? 'Saved!' : isCreating ? 'Create topic' : 'Update topic'}
      </button>

      {/* Delete button — only for editing */}
      {initial && (
        <button
          type="button"
          onClick={() => setPendingDelete(true)}
          className="w-full h-11 rounded-xl border border-red-500 text-red-500 hover:bg-red-500/10 transition-colors font-medium"
        >
          Delete topic
        </button>
      )}

      <ConfirmDialog
        open={pendingDelete}
        busy={deleting}
        title={`Delete "${initial?.title || ''}"?`}
        message="This topic and all its content blocks will be permanently deleted. This can't be undone."
        confirmLabel="Delete topic"
        onConfirm={handleDelete}
        onCancel={() => { if (!deleting) setPendingDelete(false) }}
      />
    </form>
  )
}
