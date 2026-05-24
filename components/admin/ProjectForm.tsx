'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X, Upload, ImagePlus } from 'lucide-react'
import TagSelector from '@/components/admin/TagSelector'
import Switch from '@/components/admin/Switch'

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
  initial?: Partial<FormData & { tagIds: string[]; images: string[] }>
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
  const [images, setImages] = useState<string[]>(initial?.images ?? [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [galleryUploading, setGalleryUploading] = useState(false)

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

  async function handleGalleryUpload(files: FileList) {
    setGalleryUploading(true)
    const uploaded: string[] = []
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (res.ok) {
        const { url } = await res.json()
        uploaded.push(url)
      }
    }
    setImages((prev) => [...prev, ...uploaded])
    setGalleryUploading(false)
  }

  function removeGalleryImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx))
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
      tech: form.tech
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      liveUrl: form.liveUrl || null,
      repoUrl: form.repoUrl || null,
      imageUrl: form.imageUrl || null,
      images,
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
      setSaved(true)
      router.refresh()
      if (!projectId) {
        router.push('/admin/projects')
      } else {
        setTimeout(() => setSaved(false), 2000)
      }
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to save')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          {error}
        </div>
      )}

      <Field label="Title" required>
        <input
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          required
          className={inputCls}
        />
      </Field>

      <Field label="Description" required>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          required
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-sm resize-y"
        />
      </Field>

      <Field label="Tech stack" hint="Comma-separated">
        <input
          value={form.tech}
          onChange={(e) => set('tech', e.target.value)}
          placeholder="React, Node.js, PostgreSQL"
          className={inputCls}
        />
      </Field>

      <Field label="Live URL">
        <input
          type="url"
          value={form.liveUrl}
          onChange={(e) => set('liveUrl', e.target.value)}
          className={inputCls}
        />
      </Field>

      <Field label="Repo URL">
        <input
          type="url"
          value={form.repoUrl}
          onChange={(e) => set('repoUrl', e.target.value)}
          className={inputCls}
        />
      </Field>

      <Field label="Cover image">
        <div className="flex gap-2 items-stretch">
          <input
            value={form.imageUrl}
            onChange={(e) => set('imageUrl', e.target.value)}
            placeholder="https://… or upload"
            className={`${inputCls} flex-1`}
          />
          <label className="tap-scale cursor-pointer px-3 text-sm border border-[var(--border)] rounded-xl text-[var(--muted)] flex items-center gap-1.5 hover:border-[var(--accent)] hover:text-[var(--foreground)] transition-colors whitespace-nowrap">
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
        {form.imageUrl && (
          <div className="mt-3 relative aspect-video w-full max-w-xs rounded-2xl overflow-hidden border border-[var(--border)]">
            <Image src={form.imageUrl} alt="Cover" fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => set('imageUrl', '')}
              aria-label="Remove"
              className="tap-scale absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </Field>

      <Field label="Gallery images">
        <label className="tap-scale cursor-pointer inline-flex items-center gap-2 px-4 h-11 text-sm border border-[var(--border)] rounded-xl text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)] transition-colors font-medium">
          <ImagePlus size={16} />
          {galleryUploading ? 'Uploading…' : 'Add images'}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleGalleryUpload(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
        {images.length > 0 && (
          <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
            {images.map((url, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border)]"
              >
                <Image src={url} alt="" fill className="object-cover" unoptimized />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(i)}
                  aria-label="Remove"
                  className="tap-scale absolute top-1 right-1 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Field>

      <div>
        <label className="block text-sm text-[var(--muted)] mb-2 font-medium">Tags</label>
        <TagSelector selectedIds={tagIds} onChange={setTagIds} />
      </div>

      <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--foreground)]">Featured on homepage</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {form.featured
                ? 'Highlighted in the featured projects grid.'
                : 'Listed normally, not featured.'}
            </p>
          </div>
          <Switch
            checked={form.featured}
            onChange={(v) => set('featured', v)}
            label="Featured on homepage"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className={`tap-scale w-full h-12 rounded-2xl text-white font-semibold transition-all disabled:opacity-50 ${
          saved ? 'bg-green-600' : 'bg-[var(--accent)] hover:opacity-90'
        }`}
      >
        {saving ? 'Saving…' : saved ? 'Saved!' : projectId ? 'Update project' : 'Create project'}
      </button>
    </form>
  )
}

const inputCls =
  'w-full h-11 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-sm'

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-medium text-[var(--foreground)]">
          {label}
          {required && <span className="text-[var(--accent)] ml-0.5">*</span>}
        </span>
        {hint && <span className="text-xs text-[var(--muted)]">{hint}</span>}
      </label>
      {children}
    </div>
  )
}
