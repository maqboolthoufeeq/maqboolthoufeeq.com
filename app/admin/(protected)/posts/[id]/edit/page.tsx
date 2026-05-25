'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'
import Editor from '@/components/admin/Editor'
import TagSelector from '@/components/admin/TagSelector'
import AdminShell from '@/components/admin/AdminShell'
import Switch from '@/components/admin/Switch'

const inputCls =
  'w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]'

function toDatetimeLocal(d: string | Date | null | undefined): string {
  if (!d) return ''
  return new Date(d).toISOString().slice(0, 16)
}

export default function EditPostPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [published, setPublished] = useState(false)
  const [coverImage, setCoverImage] = useState('')
  const [publishedAt, setPublishedAt] = useState('')
  const [createdAt, setCreatedAt] = useState('')
  const [tagIds, setTagIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    fetch('/api/admin/is-owner')
      .then((r) => r.json())
      .then((d) => setIsOwner(d.isOwner === true))
  }, [])

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setTitle(data.title ?? '')
        setExcerpt(data.excerpt ?? '')
        setContent(data.content ?? '')
        setPublished(data.published ?? false)
        setCoverImage(data.coverImage ?? '')
        setPublishedAt(toDatetimeLocal(data.publishedAt))
        setCreatedAt(toDatetimeLocal(data.createdAt))
        setTagIds((data.tags ?? []).map((t: { id: string }) => t.id))
        setLoading(false)
      })
  }, [id])

  async function handleImageUpload(file: File) {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    setUploading(false)
    if (res.ok) {
      const { url } = await res.json()
      setCoverImage(url)
    }
  }

  async function handleTogglePublish() {
    setPublishing(true)
    const next = !published
    const res = await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: next }),
    })
    setPublishing(false)
    if (res.ok) {
      setPublished(next)
      if (next && !publishedAt) setPublishedAt(toDatetimeLocal(new Date()))
    }
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required')
      return
    }
    setSaving(true)
    setError('')

    const res = await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        excerpt,
        content,
        published,
        coverImage: coverImage || null,
        publishedAt: publishedAt || null,
        createdAt: createdAt || null,
        tagIds,
      }),
    })

    setSaving(false)
    if (res.ok) {
      router.push('/admin/posts')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to save')
    }
  }

  if (loading) {
    return (
      <AdminShell title="Edit post" back="/admin/posts">
        <p className="text-center text-[var(--muted)] py-12">Loading…</p>
      </AdminShell>
    )
  }

  return (
    <AdminShell
      title="Edit post"
      back="/admin/posts"
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePublish}
            disabled={publishing}
            className={`tap-scale inline-flex items-center justify-center h-10 px-4 rounded-full text-sm font-semibold disabled:opacity-50 ${
              published
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'btn-publish'
            }`}
          >
            {publishing ? '…' : published ? 'Unpublish' : 'Publish'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="tap-scale inline-flex items-center justify-center h-10 px-4 rounded-full bg-[var(--accent)] text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      }
    >
      <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-2xl sm:text-3xl font-bold bg-transparent border-none outline-none text-[var(--foreground)] placeholder:text-[var(--border)]"
        />

        <input
          type="text"
          placeholder="Short excerpt (optional)"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className={inputCls}
        />

        <div>
          <label className="block text-sm text-[var(--muted)] mb-2 font-medium">Cover image</label>
          <div className="flex gap-2 items-stretch">
            <input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://…"
              className={`${inputCls} flex-1`}
            />
            <label className="tap-scale cursor-pointer h-auto px-3 text-sm border border-[var(--border)] rounded-xl text-[var(--muted)] flex items-center gap-1.5 hover:border-[var(--accent)] hover:text-[var(--foreground)] transition-colors whitespace-nowrap">
              <Upload size={15} />
              {uploading ? '…' : 'Upload'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleImageUpload(f)
                }}
              />
            </label>
          </div>
          {coverImage && (
            <div className="mt-3 relative aspect-video w-full rounded-2xl overflow-hidden border border-[var(--border)]">
              <Image
                src={coverImage}
                alt="Cover preview"
                fill
                className="object-cover"
                unoptimized={coverImage.startsWith('http')}
              />
              <button
                type="button"
                onClick={() => setCoverImage('')}
                aria-label="Remove cover"
                className="tap-scale absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <Editor content={content} onChange={setContent} />

        <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Settings</h2>

          <SettingRow
            label="Publish"
            description={
              published
                ? 'Visible to everyone on your site.'
                : 'Saved as draft, not visible publicly.'
            }
          >
            <Switch checked={published} onChange={setPublished} label="Publish" />
          </SettingRow>

          <div className="grid sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1 font-medium">
                Published at (UTC)
              </label>
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className={inputCls}
              />
            </div>
            {isOwner && (
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1 font-medium">
                  Created at (UTC)
                </label>
                <input
                  type="datetime-local"
                  value={createdAt}
                  onChange={(e) => setCreatedAt(e.target.value)}
                  className={inputCls}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-[var(--muted)] mb-2 font-medium">Tags</label>
            <TagSelector selectedIds={tagIds} onChange={setTagIds} />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleTogglePublish}
            disabled={publishing}
            className={`tap-scale flex-1 h-12 rounded-2xl text-sm font-semibold disabled:opacity-50 ${
              published
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'btn-publish'
            }`}
          >
            {publishing ? '…' : published ? 'Unpublish' : 'Publish'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="tap-scale flex-1 h-12 rounded-2xl bg-[var(--accent)] text-white font-semibold disabled:opacity-50 hover:opacity-90"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </AdminShell>
  )
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
        {description && <p className="text-xs text-[var(--muted)] mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
