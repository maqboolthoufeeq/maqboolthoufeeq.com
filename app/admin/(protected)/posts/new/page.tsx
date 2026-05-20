'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Editor from '@/components/admin/Editor'

export default function NewPostPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
      body: JSON.stringify({ title, excerpt, content, published }),
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
          className="w-full text-sm px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
        />

        <Editor content={content} onChange={setContent} />
      </main>
    </div>
  )
}
