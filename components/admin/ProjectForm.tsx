'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TagSelector from '@/components/admin/TagSelector'

type FormData = {
  title: string
  description: string
  tech: string
  liveUrl: string
  repoUrl: string
  imageUrl: string
  featured: boolean
}

type Props = {
  projectId?: string
  initial?: Partial<FormData & { tagIds: string[] }>
}

export default function ProjectForm({ projectId, initial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormData>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    tech: initial?.tech ?? '',
    liveUrl: initial?.liveUrl ?? '',
    repoUrl: initial?.repoUrl ?? '',
    imageUrl: initial?.imageUrl ?? '',
    featured: initial?.featured ?? false,
  })
  const [tagIds, setTagIds] = useState<string[]>(initial?.tagIds ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  function set(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleImageUpload(file: File) {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    setUploading(false)
    if (res.ok) {
      const { url } = await res.json()
      set('imageUrl', url)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required')
      return
    }
    setSaving(true)
    setError('')

    const body = {
      ...form,
      tech: form.tech.split(',').map((t) => t.trim()).filter(Boolean),
      liveUrl: form.liveUrl || null,
      repoUrl: form.repoUrl || null,
      imageUrl: form.imageUrl || null,
      tagIds,
    }

    const url = projectId ? `/api/projects/${projectId}` : '/api/projects'
    const method = projectId ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setSaving(false)
    if (res.ok) {
      router.push('/admin/projects')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to save')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <Field label="Title *">
        <input value={form.title} onChange={(e) => set('title', e.target.value)} required className={inputCls} />
      </Field>

      <Field label="Description *">
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} required rows={3} className={inputCls} />
      </Field>

      <Field label="Tech stack (comma-separated)">
        <input value={form.tech} onChange={(e) => set('tech', e.target.value)} placeholder="React, Node.js, PostgreSQL" className={inputCls} />
      </Field>

      <Field label="Live URL">
        <input type="url" value={form.liveUrl} onChange={(e) => set('liveUrl', e.target.value)} className={inputCls} />
      </Field>

      <Field label="Repo URL">
        <input type="url" value={form.repoUrl} onChange={(e) => set('repoUrl', e.target.value)} className={inputCls} />
      </Field>

      <Field label="Image">
        <div className="flex gap-2 items-center">
          <input
            value={form.imageUrl}
            onChange={(e) => set('imageUrl', e.target.value)}
            placeholder="https://… or upload below"
            className={`${inputCls} flex-1`}
          />
          <label className="cursor-pointer px-3 py-2 text-sm border border-[var(--border)] rounded-lg text-[var(--muted)] hover:border-[var(--accent)] transition-colors">
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
      </Field>

      <div>
        <label className="block text-sm text-[var(--muted)] mb-2">Tags</label>
        <TagSelector selectedIds={tagIds} onChange={setTagIds} />
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--muted)] cursor-pointer">
        <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} className="accent-[var(--accent)]" />
        Featured on homepage
      </label>

      <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
        {saving ? 'Saving…' : projectId ? 'Update project' : 'Create project'}
      </button>
    </form>
  )
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-sm'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-[var(--muted)] mb-1">{label}</label>
      {children}
    </div>
  )
}
