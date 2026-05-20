'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Editor from '@/components/admin/Editor'
import TagSelector from '@/components/admin/TagSelector'

const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]'

export default function NewPostPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [published, setPublished] = useState(false)
  const [coverImage, setCoverImage] = useState('')
  const [publishedAt, setPublishedAt] = useState('')
  const [createdAt, setCreatedAt] = useState('')
  const [tagIds, setTagIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

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

  async function handleSave() {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required')
      return
    }
    setSaving(true)
    setError('')

    const res = await fetch('/api/posts', {
      method: 'POST',
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

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/posts" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">← Posts</Link>
          <span className="text-[var(--border)]">/</span>
          <h1 className="font-semibold text-[var(--foreground)]">New Post</h1>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-[var(--muted)] cursor-pointer">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="accent-[var(--accent)]" />
            Publish
          </label>
          <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {error && <p className="text-red-400 text-sm">{error}</p>}

        <input
          type="text"
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-2xl font-bold bg-transparent border-none outline-none text-[var(--foreground)] placeholder:text-[var(--border)]"
        />

        <input
          type="text"
          placeholder="Short excerpt (optional)"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className={inputCls}
        />

        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">Cover image</label>
          <div className="flex gap-2 items-start">
            <input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://… or upload"
              className={`${inputCls} flex-1`}
            />
            <label className="cursor-pointer px-3 py-2 text-sm border border-[var(--border)] rounded-lg text-[var(--muted)] hover:border-[var(--accent)] transition-colors whitespace-nowrap">
              {uploading ? '…' : 'Upload'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }} />
            </label>
          </div>
          {coverImage && (
            <div className="mt-2 relative h-40 w-full rounded-lg overflow-hidden border border-[var(--border)]">
              <Image src={coverImage} alt="Cover preview" fill className="object-cover" unoptimized={coverImage.startsWith('http')} />
            </div>
          )}
        </div>

        <Editor content={content} onChange={setContent} />

        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
          <h2 className="text-sm font-medium text-[var(--foreground)]">Metadata</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1">Published At (UTC)</label>
              <input type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1">Created At (UTC)</label>
              <input type="datetime-local" value={createdAt} onChange={(e) => setCreatedAt(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--muted)] mb-2">Tags</label>
            <TagSelector selectedIds={tagIds} onChange={setTagIds} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <label className="flex items-center gap-2 text-sm text-[var(--muted)] cursor-pointer">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="accent-[var(--accent)]" />
            Publish
          </label>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </main>
    </div>
  )
}
