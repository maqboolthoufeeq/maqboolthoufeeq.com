'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { HeroContent, AboutContent, ContactContent, FooterContent, ContactLink, ContactExtra, NavbarContent, NavLink, ImageShape, ImageSize, SectionVisibility, SocialLink } from '@/lib/site-content'

const SOCIAL_PLATFORMS = [
  { value: 'github', label: 'GitHub' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'discord', label: 'Discord' },
  { value: 'devto', label: 'Dev.to' },
  { value: 'medium', label: 'Medium' },
  { value: 'website', label: 'Website' },
  { value: 'email', label: 'Email' },
]

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-sm'
const textareaCls = `${inputCls} resize-y`

const PREVIEW_SIZE: Record<string, string> = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
}
const PREVIEW_SHAPE: Record<string, string> = {
  circle: 'rounded-full',
  rounded: 'rounded-xl',
  square: 'rounded-none',
}

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
    <div className="flex items-center justify-between pt-5 mt-2 border-t border-[var(--border)]">
      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity text-sm font-medium"
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
      {saved && <span className="text-sm text-green-400">Saved!</span>}
    </div>
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

// ─── Collapsible Section Card ─────────────────────────────────────────────────

export function CollapsibleSection({
  title,
  description,
  children,
  toggle,
  defaultOpen = true,
}: {
  title: string
  description: string
  children: React.ReactNode
  toggle?: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => !o) } }}
        className="w-full px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)] flex items-start justify-between gap-4 text-left cursor-pointer hover:bg-[var(--surface-hover,var(--surface))] transition-colors select-none"
      >
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 text-[var(--muted)] transition-transform duration-200"
            style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            ▶
          </span>
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">{title}</h2>
            <p className="text-sm text-[var(--muted)] mt-0.5">{description}</p>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>{toggle}</div>
      </div>
      {open && <div className="px-6 py-6">{children}</div>}
    </div>
  )
}

// ─── Section Visibility Toggle ───────────────────────────────────────────────

export function SectionToggle({ sectionKey, initialSections }: {
  sectionKey: keyof SectionVisibility
  initialSections: SectionVisibility
}) {
  const [on, setOn] = useState(initialSections[sectionKey])
  const [saving, setSaving] = useState(false)

  async function toggle() {
    const next = !on
    setOn(next)
    setSaving(true)
    try {
      const res = await fetch('/api/site-content/sections')
      const current = await res.json()
      await fetch('/api/site-content/sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...current, [sectionKey]: next }),
      })
    } catch {
      setOn(!next)
    } finally {
      setSaving(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={saving}
      className={[
        'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all disabled:opacity-50',
        on
          ? 'border-green-500/40 text-green-400 bg-green-500/10 hover:bg-green-500/20'
          : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)]',
      ].join(' ')}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-green-400' : 'bg-[var(--muted)]'}`} />
      {saving ? '…' : on ? 'Live' : 'Hidden'}
    </button>
  )
}

// ─── Navbar ──────────────────────────────────────────────────────────────────

export function NavbarForm({ initial }: { initial: NavbarContent }) {
  const [brandName, setBrandName] = useState(initial.brandName)
  const [brandTag, setBrandTag] = useState(initial.brandTag ?? '')
  const [links, setLinks] = useState<NavLink[]>(initial.links)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function setLink(i: number, field: keyof NavLink, value: string) {
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

  function moveLink(i: number, dir: -1 | 1) {
    setLinks((prev) => {
      const next = [...prev]
      const swap = i + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[i], next[swap]] = [next[swap], next[i]]
      return next
    })
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await save('navbar', { brandName, brandTag, links: links.filter((l) => l.label && l.href) })
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
      <Field label="Brand tag (shown above logo text)">
        <input
          value={brandTag}
          onChange={(e) => { setBrandTag(e.target.value); setSaved(false) }}
          placeholder="e.g. Tharayil"
          className={inputCls}
        />
      </Field>
      <Field label="Brand name (logo text)">
        <input
          value={brandName}
          onChange={(e) => { setBrandName(e.target.value); setSaved(false) }}
          className={inputCls}
        />
      </Field>
      <div className="space-y-2">
        <label className="block text-sm text-[var(--muted)]">Nav links</label>
        {links.map((link, i) => (
          <div key={i} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--muted)]">Link {i + 1}</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => moveLink(i, -1)} disabled={i === 0} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-20 px-1">▲</button>
                <button type="button" onClick={() => moveLink(i, 1)} disabled={i === links.length - 1} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-20 px-1">▼</button>
                <button type="button" onClick={() => removeLink(i)} className="text-xs text-[var(--muted)] hover:text-red-400 px-1">Remove</button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">Label</label>
                <input
                  value={link.label}
                  onChange={(e) => setLink(i, 'label', e.target.value)}
                  placeholder="e.g. About"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">Link / URL</label>
                <input
                  value={link.href}
                  onChange={(e) => setLink(i, 'href', e.target.value)}
                  placeholder="/#section or /page"
                  className={inputCls}
                />
              </div>
            </div>
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

// ─── Hero ────────────────────────────────────────────────────────────────────

export function HeroForm({ initial }: { initial: HeroContent }) {
  const [form, setForm] = useState(initial)
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(initial.socialLinks ?? [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof HeroContent, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
    setSaved(false)
  }

  function setSocial(i: number, field: keyof SocialLink, value: string) {
    setSocialLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)))
    setSaved(false)
  }

  function addSocial() {
    setSocialLinks((l) => [...l, { platform: 'github', href: '' }])
    setSaved(false)
  }

  function removeSocial(i: number) {
    setSocialLinks((l) => l.filter((_, idx) => idx !== i))
    setSaved(false)
  }

  function moveSocial(i: number, dir: -1 | 1) {
    setSocialLinks((prev) => {
      const next = [...prev]
      const swap = i + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[i], next[swap]] = [next[swap], next[i]]
      return next
    })
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
      await save('hero', { ...form, socialLinks })
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

      <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--background)] flex flex-col sm:flex-row gap-6 items-start">
        <div className="flex-shrink-0 flex flex-col items-center gap-2">
          <span className="text-xs text-[var(--muted)]">Preview</span>
          {form.imageVisible === false ? (
            <div className="w-24 h-24 rounded-lg border border-dashed border-[var(--border)] flex items-center justify-center text-xs text-[var(--muted)]">
              Hidden
            </div>
          ) : form.imageUrl ? (
            <div className={[
              PREVIEW_SIZE[form.imageSize ?? 'md'],
              PREVIEW_SHAPE[form.imageShape ?? 'circle'],
              'overflow-hidden border-2 border-[var(--accent)]',
            ].join(' ')}>
              <Image
                src={form.imageUrl}
                alt="Preview"
                width={96}
                height={96}
                className="object-cover w-full h-full"
                unoptimized={form.imageUrl.startsWith('http')}
              />
            </div>
          ) : (
            <div className={[
              PREVIEW_SIZE[form.imageSize ?? 'md'],
              PREVIEW_SHAPE[form.imageShape ?? 'circle'],
              'border border-dashed border-[var(--border)] flex items-center justify-center text-xs text-[var(--muted)]',
            ].join(' ')}>
              No image
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <Field label="Profile photo URL">
            <div className="flex gap-2">
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
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Visibility">
              <select
                value={form.imageVisible === false ? 'false' : 'true'}
                onChange={(e) => { setForm((p) => ({ ...p, imageVisible: e.target.value === 'true' })); setSaved(false) }}
                className={inputCls}
              >
                <option value="true">Visible</option>
                <option value="false">Hidden</option>
              </select>
            </Field>
            <Field label="Shape">
              <select
                value={form.imageShape ?? 'circle'}
                onChange={(e) => set('imageShape', e.target.value as ImageShape)}
                className={inputCls}
              >
                <option value="circle">Circle</option>
                <option value="rounded">Rounded</option>
                <option value="square">Square</option>
              </select>
            </Field>
            <Field label="Size">
              <select
                value={form.imageSize ?? 'md'}
                onChange={(e) => set('imageSize', e.target.value as ImageSize)}
                className={inputCls}
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </Field>
          </div>
        </div>
      </div>

      <Field label="Greeting text">
        <input value={form.greeting} onChange={(e) => set('greeting', e.target.value)} className={inputCls} />
      </Field>
      <Field label="Name">
        <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} />
      </Field>
      <Field label="Last name (shown smaller below name)">
        <input value={(form as HeroContent & { lastName?: string }).lastName ?? ''} onChange={(e) => set('lastName' as keyof HeroContent, e.target.value)} placeholder="e.g. Tharayil" className={inputCls} />
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
            <input value={form.cta1Href} onChange={(e) => set('cta1Href', e.target.value)} placeholder="/#projects or https://…" className={inputCls} />
          </Field>
        </div>
        <div className="space-y-2">
          <Field label="Secondary button label">
            <input value={form.cta2Label} onChange={(e) => set('cta2Label', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Secondary button link">
            <input value={form.cta2Href} onChange={(e) => set('cta2Href', e.target.value)} placeholder="/#contact or https://…" className={inputCls} />
          </Field>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-[var(--muted)]">Social links (icon buttons below CTAs)</label>
        {socialLinks.map((link, i) => (
          <div key={i} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--muted)]">Link {i + 1}</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => moveSocial(i, -1)} disabled={i === 0} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-20 px-1">▲</button>
                <button type="button" onClick={() => moveSocial(i, 1)} disabled={i === socialLinks.length - 1} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-20 px-1">▼</button>
                <button type="button" onClick={() => removeSocial(i)} className="text-xs text-[var(--muted)] hover:text-red-400 px-1">Remove</button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">Platform</label>
                <select
                  value={link.platform}
                  onChange={(e) => setSocial(i, 'platform', e.target.value)}
                  className={inputCls}
                >
                  {SOCIAL_PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">URL</label>
                <input
                  value={link.href}
                  onChange={(e) => setSocial(i, 'href', e.target.value)}
                  placeholder="https://…"
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={addSocial} className="text-sm text-[var(--accent)] hover:underline">
          + Add social link
        </button>
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
  const [email, setEmail] = useState(initial.email ?? '')
  const [phone, setPhone] = useState(initial.phone ?? '')
  const [address, setAddress] = useState(initial.address ?? '')
  const [extra, setExtra] = useState<ContactExtra[]>(initial.extra ?? [])
  const [links, setLinks] = useState<ContactLink[]>(initial.links)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function setLink(i: number, field: keyof ContactLink, value: string) {
    setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)))
    setSaved(false)
  }
  function addLink() { setLinks((l) => [...l, { href: '', label: '' }]); setSaved(false) }
  function removeLink(i: number) { setLinks((l) => l.filter((_, idx) => idx !== i)); setSaved(false) }

  function setExtraField(i: number, field: keyof ContactExtra, value: string) {
    setExtra((prev) => prev.map((x, idx) => (idx === i ? { ...x, [field]: value } : x)))
    setSaved(false)
  }
  function addExtra() { setExtra((x) => [...x, { label: '', value: '' }]); setSaved(false) }
  function removeExtra(i: number) { setExtra((x) => x.filter((_, idx) => idx !== i)); setSaved(false) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await save('contact', {
        description,
        email,
        phone,
        address,
        extra: extra.filter((x) => x.label && x.value),
        links: links.filter((l) => l.label && l.href),
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

      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => { setDescription(e.target.value); setSaved(false) }}
          rows={3}
          className={textareaCls}
        />
      </Field>

      <div className="pt-2 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] mb-3">Contact info</p>
        <div className="space-y-3">
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setSaved(false) }}
              placeholder="you@example.com"
              className={inputCls}
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setSaved(false) }}
              placeholder="+1 234 567 8900"
              className={inputCls}
            />
          </Field>
          <Field label="Address">
            <textarea
              value={address}
              onChange={(e) => { setAddress(e.target.value); setSaved(false) }}
              rows={2}
              placeholder="123 Main St, City, Country"
              className={textareaCls}
            />
          </Field>

          <div className="space-y-2">
            <label className="block text-xs text-[var(--muted)] uppercase tracking-wide">Other info</label>
            {extra.map((x, i) => (
              <div key={i} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--muted)]">Item {i + 1}</span>
                  <button type="button" onClick={() => removeExtra(i)} className="text-xs text-[var(--muted)] hover:text-red-400 px-1">Remove</button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[var(--muted)] mb-1">Label</label>
                    <input value={x.label} onChange={(e) => setExtraField(i, 'label', e.target.value)} placeholder="e.g. Skype" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--muted)] mb-1">Value</label>
                    <input value={x.value} onChange={(e) => setExtraField(i, 'value', e.target.value)} placeholder="e.g. live:username" className={inputCls} />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addExtra} className="text-sm text-[var(--accent)] hover:underline">+ Add item</button>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] mb-3">Social / other links</p>
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={i} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted)]">Link {i + 1}</span>
                <button type="button" onClick={() => removeLink(i)} className="text-xs text-[var(--muted)] hover:text-red-400 px-1">Remove</button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--muted)] mb-1">Label</label>
                  <input value={link.label} onChange={(e) => setLink(i, 'label', e.target.value)} placeholder="e.g. GitHub" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted)] mb-1">URL</label>
                  <input value={link.href} onChange={(e) => setLink(i, 'href', e.target.value)} placeholder="https://… or mailto:…" className={inputCls} />
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addLink} className="text-sm text-[var(--accent)] hover:underline">+ Add link</button>
        </div>
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
