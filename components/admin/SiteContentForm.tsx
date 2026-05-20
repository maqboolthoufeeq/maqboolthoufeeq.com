'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { HeroContent, AboutContent, ContactContent, FooterContent, ContactLink } from '@/lib/site-content'

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-sm'
const textareaCls = `${inputCls} resize-y`

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-[var(--muted)] mb-1">{label}</label>
      {children}
    </div>
  )
}

function SaveButton({ saving, saved }: { saving: boolean; saved: boolean }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="px-6 py-2.5 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
    >
      {saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
    </button>
  )
}

async function save(key: string, body: unknown) {
  const res = await fetch(`/api/site-content/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to save')
}

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  if (!res.ok) throw new Error('Upload failed')
  const { url } = await res.json()
  return url
}

// ─── Hero ────────────────────────────────────────────────────────────────────

export function HeroForm({ initial }: { initial: HeroContent }) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof HeroContent, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
    setSaved(false)
  }

  async function handleImageUpload(file: File) {
    setUploading(true)
    try {
      const url = await uploadFile(file)
      set('imageUrl', url)
    } catch {
      setError('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await save('hero', form)
      setSaved(true)
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <Field label="Profile photo">
        <div className="flex items-center gap-4">
          {form.imageUrl && (
            <div className="w-16 h-16 rounded-full overflow-hidden border border-[var(--border)] flex-shrink-0">
              <Image
                src={form.imageUrl}
                alt="Preview"
                width={64}
                height={64}
                className="object-cover w-full h-full"
                unoptimized={form.imageUrl.startsWith('http')}
              />
            </div>
          )}
          <div className="flex-1 flex gap-2">
            <input
              value={form.imageUrl}
              onChange={(e) => set('imageUrl', e.target.value)}
              placeholder="/headshot.jpg or https://…"
              className={`${inputCls} flex-1`}
            />
            <label className="cursor-pointer px-3 py-2 text-sm border border-[var(--border)] rounded-lg text-[var(--muted)] hover:border-[var(--accent)] transition-colors whitespace-nowrap">
              {uploading ? '…' : 'Upload'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }}
              />
            </label>
          </div>
        </div>
      </Field>

      <Field label="Greeting text">
        <input value={form.greeting} onChange={(e) => set('greeting', e.target.value)} className={inputCls} />
      </Field>
      <Field label="Name">
        <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} />
      </Field>
      <Field label="Title / role">
        <input value={form.title} onChange={(e) => set('title', e.target.value)} className={inputCls} />
      </Field>
      <Field label="Description">
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className={textareaCls} />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Field label="Primary button label">
            <input value={form.cta1Label} onChange={(e) => set('cta1Label', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Primary button link">
            <input value={form.cta1Href} onChange={(e) => set('cta1Href', e.target.value)} placeholder="/#projects" className={inputCls} />
          </Field>
        </div>
        <div className="space-y-2">
          <Field label="Secondary button label">
            <input value={form.cta2Label} onChange={(e) => set('cta2Label', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Secondary button link">
            <input value={form.cta2Href} onChange={(e) => set('cta2Href', e.target.value)} placeholder="/#contact" className={inputCls} />
          </Field>
        </div>
      </div>

      <SaveButton saving={saving} saved={saved} />
    </form>
  )
}

// ─── About ───────────────────────────────────────────────────────────────────

export function AboutForm({ initial }: { initial: AboutContent }) {
  const [paragraphs, setParagraphs] = useState(initial.paragraphs)
  const [skills, setSkills] = useState(initial.skills.join(', '))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function setParagraph(i: number, value: string) {
    setParagraphs((prev) => prev.map((p, idx) => (idx === i ? value : p)))
    setSaved(false)
  }

  function addParagraph() {
    setParagraphs((p) => [...p, ''])
    setSaved(false)
  }

  function removeParagraph(i: number) {
    setParagraphs((p) => p.filter((_, idx) => idx !== i))
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await save('about', {
        paragraphs: paragraphs.filter(Boolean),
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
      })
      setSaved(true)
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="space-y-2">
        <label className="block text-sm text-[var(--muted)]">Bio paragraphs</label>
        {paragraphs.map((p, i) => (
          <div key={i} className="flex gap-2">
            <textarea
              value={p}
              onChange={(e) => setParagraph(i, e.target.value)}
              rows={3}
              className={`${textareaCls} flex-1`}
            />
            <button
              type="button"
              onClick={() => removeParagraph(i)}
              className="text-[var(--muted)] hover:text-red-400 text-sm px-2 self-start mt-2"
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" onClick={addParagraph} className="text-sm text-[var(--accent)] hover:underline">
          + Add paragraph
        </button>
      </div>
      <Field label="Skills (comma-separated)">
        <input
          value={skills}
          onChange={(e) => { setSkills(e.target.value); setSaved(false) }}
          placeholder="TypeScript, React, Next.js"
          className={inputCls}
        />
      </Field>
      <SaveButton saving={saving} saved={saved} />
    </form>
  )
}

// ─── Contact ─────────────────────────────────────────────────────────────────

export function ContactForm({ initial }: { initial: ContactContent }) {
  const [description, setDescription] = useState(initial.description)
  const [links, setLinks] = useState<ContactLink[]>(initial.links)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function setLink(i: number, field: keyof ContactLink, value: string) {
    setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)))
    setSaved(false)
  }

  function addLink() {
    setLinks((l) => [...l, { href: '', label: '' }])
    setSaved(false)
  }

  function removeLink(i: number) {
    setLinks((l) => l.filter((_, idx) => idx !== i))
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await save('contact', { description, links: links.filter((l) => l.label && l.href) })
      setSaved(true)
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => { setDescription(e.target.value); setSaved(false) }}
          rows={3}
          className={textareaCls}
        />
      </Field>
      <div className="space-y-2">
        <label className="block text-sm text-[var(--muted)]">Links</label>
        {links.map((link, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={link.label}
              onChange={(e) => setLink(i, 'label', e.target.value)}
              placeholder="Label"
              className={`${inputCls} w-28 flex-shrink-0`}
            />
            <input
              value={link.href}
              onChange={(e) => setLink(i, 'href', e.target.value)}
              placeholder="URL or mailto:"
              className={`${inputCls} flex-1`}
            />
            <button type="button" onClick={() => removeLink(i)} className="text-[var(--muted)] hover:text-red-400 text-sm px-1">
              ✕
            </button>
          </div>
        ))}
        <button type="button" onClick={addLink} className="text-sm text-[var(--accent)] hover:underline">
          + Add link
        </button>
      </div>
      <SaveButton saving={saving} saved={saved} />
    </form>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────

export function FooterForm({ initial }: { initial: FooterContent }) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await save('footer', form)
      setSaved(true)
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <Field label="Copyright name">
        <input
          value={form.copyrightName}
          onChange={(e) => { setForm({ copyrightName: e.target.value }); setSaved(false) }}
          className={inputCls}
        />
      </Field>
      <p className="text-xs text-[var(--muted)]">
        Preview: {new Date().getFullYear()} {form.copyrightName}
      </p>
      <SaveButton saving={saving} saved={saved} />
    </form>
  )
}
