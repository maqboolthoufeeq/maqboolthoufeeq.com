'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  X, Upload, Film, Sparkles, Loader2, RefreshCw, AlertCircle, CheckCircle2, ChevronRight,
} from 'lucide-react'
import Switch from '@/components/admin/Switch'
import { LinksEditor, AttachmentsEditor } from '@/components/admin/MediaExtrasFields'
import { InstagramIcon, YoutubeIcon } from '@/components/social/icons'
import {
  type Platform,
  type MediaLink,
  type MediaAttachment,
  detectPlatform,
  parseEmbedId,
  isPlatform,
  resolveThumbnail,
  youTubeThumbnail,
  mediaOrientation,
  aspectClassForOrientation,
} from '@/lib/social'

type FormData = {
  platform: Platform
  title: string
  sourceUrl: string
  description: string
  thumbnailUrl: string
  previewVideoUrl: string
  links: MediaLink[]
  attachments: MediaAttachment[]
  categoryId: string
  featured: boolean
  published: boolean
  showDate: boolean
  displayDate: string // YYYY-MM-DD for the date input
}

type Category = { id: string; name: string }
type FetchStatus = { type: 'idle' | 'ok' | 'blocked' | 'error'; message?: string }

type Props = {
  mediaId?: string
  initial?: Partial<FormData>
  defaultPlatform?: Platform
  /** Where to go after creating — defaults to the media list. */
  returnTo?: string
}

export default function MediaForm({ mediaId, initial, defaultPlatform = 'instagram', returnTo }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormData>({
    platform: initial?.platform ?? defaultPlatform,
    title: initial?.title ?? '',
    sourceUrl: initial?.sourceUrl ?? '',
    description: initial?.description ?? '',
    thumbnailUrl: initial?.thumbnailUrl ?? '',
    previewVideoUrl: initial?.previewVideoUrl ?? '',
    links: initial?.links ?? [],
    attachments: initial?.attachments ?? [],
    categoryId: initial?.categoryId ?? '',
    featured: initial?.featured ?? false,
    published: initial?.published ?? true,
    showDate: initial?.showDate ?? false,
    displayDate: initial?.displayDate ?? '',
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [uploadingClip, setUploadingClip] = useState(false)
  const [platformLocked, setPlatformLocked] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>({ type: 'idle' })
  const [advancedOpen, setAdvancedOpen] = useState(false)
  // The last URL we auto-fetched, so editing an existing item doesn't refetch on mount.
  const lastFetched = useRef(initial?.sourceUrl ?? '')

  useEffect(() => {
    fetch('/api/media-categories')
      .then((r) => r.json())
      .then((data: Category[]) => setCategories(data))
      .catch(() => {})
  }, [])

  function set<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const embedId = useMemo(() => parseEmbedId(form.platform, form.sourceUrl), [form.platform, form.sourceUrl])
  const urlInvalid = form.sourceUrl.trim().length > 0 && !embedId
  const orientation = mediaOrientation(form.platform, form.sourceUrl)
  const previewThumb = embedId
    ? resolveThumbnail(form.platform, embedId, form.thumbnailUrl || null, 'maxres')
    : form.thumbnailUrl || null

  function onUrlChange(value: string) {
    setForm((prev) => {
      const detected = detectPlatform(value)
      return { ...prev, sourceUrl: value, platform: !platformLocked && detected ? detected : prev.platform }
    })
    setSaved(false)
  }

  // Auto-fetch title / description / thumbnail shortly after a valid link is pasted.
  useEffect(() => {
    const url = form.sourceUrl.trim()
    if (!url || !embedId || url === lastFetched.current) return
    const t = setTimeout(() => runFetch(false), 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.sourceUrl, form.platform, embedId])

  async function runFetch(overwrite: boolean) {
    const url = form.sourceUrl.trim()
    if (!url || !embedId) return
    lastFetched.current = url
    setFetching(true)
    setFetchStatus({ type: 'idle' })
    try {
      const res = await fetch('/api/media/fetch-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, platform: form.platform }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFetchStatus({ type: 'error', message: data.error ?? 'Couldn’t fetch details' })
        return
      }
      if (data.blocked) {
        setFetchStatus({ type: 'blocked', message: data.message })
        setAdvancedOpen(true) // surface the manual thumbnail field as a fallback
        return
      }
      setForm((prev) => ({
        ...prev,
        platform: isPlatform(data.platform) ? data.platform : prev.platform,
        title: overwrite || !prev.title.trim() ? (data.title ?? prev.title) : prev.title,
        description: overwrite || !prev.description.trim() ? (data.description ?? prev.description) : prev.description,
        thumbnailUrl: data.thumbnailUrl ?? prev.thumbnailUrl,
      }))
      setSaved(false)
      setFetchStatus({
        type: 'ok',
        message: data.author
          ? `Fetched from ${data.platform === 'youtube' ? 'YouTube' : 'Instagram'} · @${data.author}`
          : 'Details fetched',
      })
    } catch {
      setFetchStatus({ type: 'error', message: 'Network error while fetching details' })
    } finally {
      setFetching(false)
    }
  }

  async function upload(file: File): Promise<string | null> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (res.ok) return (await res.json()).url as string
    const data = await res.json().catch(() => ({}))
    setError(data.error ?? 'Upload failed')
    return null
  }

  async function handleThumbUpload(file: File) {
    setUploadingThumb(true); setError('')
    const url = await upload(file)
    if (url) set('thumbnailUrl', url)
    setUploadingThumb(false)
  }

  async function handleClipUpload(file: File) {
    setUploadingClip(true); setError('')
    const url = await upload(file)
    if (url) set('previewVideoUrl', url)
    setUploadingClip(false)
  }

  async function handleCreateCategory() {
    const name = newCategory.trim()
    if (!name) return
    setCreatingCategory(true)
    const res = await fetch('/api/media-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setCreatingCategory(false)
    if (res.ok) {
      const cat: Category = await res.json()
      setCategories((prev) => [...prev, cat])
      set('categoryId', cat.id)
      setNewCategory('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return setError('Title is required')
    if (!form.sourceUrl.trim()) return setError('A reel or video URL is required')
    if (!embedId) return setError('That URL doesn’t look like a valid ' + (form.platform === 'youtube' ? 'YouTube video' : 'Instagram reel'))

    setSaving(true); setError('')
    const url = mediaId ? `/api/media/${mediaId}` : '/api/media'
    const method = mediaId ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        title: form.title.trim(),
        description: form.description.trim() || null,
        thumbnailUrl: form.thumbnailUrl.trim() || null,
        previewVideoUrl: form.previewVideoUrl.trim() || null,
        categoryId: form.categoryId || null,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      router.refresh()
      if (!mediaId) router.push(returnTo || '/admin/media')
      else setTimeout(() => setSaved(false), 2000)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to save')
    }
  }

  const isReel = form.platform === 'instagram'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">{error}</div>
      )}

      {/* Platform picker */}
      <Field label="Type">
        <div className="grid grid-cols-2 gap-2">
          {(['instagram', 'youtube'] as Platform[]).map((p) => {
            const active = form.platform === p
            const Icon = p === 'instagram' ? InstagramIcon : YoutubeIcon
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPlatformLocked(true)
                  setForm((prev) => ({ ...prev, platform: p, previewVideoUrl: p === 'youtube' ? '' : prev.previewVideoUrl }))
                  setSaved(false)
                }}
                className={[
                  'tap-scale h-11 rounded-xl border text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors',
                  active
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]',
                ].join(' ')}
              >
                <Icon size={16} />
                {p === 'instagram' ? 'Instagram' : 'YouTube'}
              </button>
            )
          })}
        </div>
      </Field>

      {/* Paste link → auto-fetch */}
      <Field
        label={isReel ? 'Paste the Instagram reel link' : 'Paste the YouTube link'}
        required
        hint={embedId ? `id: ${embedId}` : 'video, short or reel'}
      >
        <div className="flex gap-2 items-stretch">
          <input
            value={form.sourceUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder={isReel ? 'https://www.instagram.com/reel/…' : 'https://youtube.com/watch?v=… or /shorts/…'}
            className={`${inputCls} flex-1 ${urlInvalid ? 'border-red-500/60' : ''}`}
            inputMode="url"
          />
          <button
            type="button"
            onClick={() => runFetch(true)}
            disabled={!embedId || fetching}
            title="Fetch title, description & thumbnail"
            className="tap-scale px-3 h-11 inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--accent)] hover:border-[var(--accent)] disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            {fetching ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            <span className="hidden sm:inline">{fetching ? 'Fetching…' : 'Auto-fill'}</span>
          </button>
        </div>
        {urlInvalid && (
          <p className="text-xs text-red-500 mt-1.5">
            Couldn’t find a {isReel ? 'reel' : 'video'} id in that link. Paste the full share URL.
          </p>
        )}
        {!urlInvalid && fetchStatus.type !== 'idle' && (
          <FetchNote status={fetchStatus} onRetry={() => runFetch(true)} />
        )}
      </Field>

      {/* Live card preview */}
      {embedId && (
        <div className="flex gap-4 items-center p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <div className={`relative shrink-0 overflow-hidden rounded-xl bg-black ${orientation === 'portrait' ? 'w-16' : 'w-28'} ${aspectClassForOrientation(orientation)}`}>
            {previewThumb ? (
              <img
                src={previewThumb}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  if (form.platform === 'youtube') (e.currentTarget as HTMLImageElement).src = youTubeThumbnail(embedId, 'hq')
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/40"><Film size={20} /></div>
            )}
          </div>
          <div className="min-w-0 text-sm flex-1">
            <p className="font-medium text-[var(--foreground)] line-clamp-2">{form.title || 'Untitled'}</p>
            <p className="text-xs text-[var(--muted)] mt-1 inline-flex items-center gap-1.5">
              {isReel ? <InstagramIcon size={12} /> : <YoutubeIcon size={12} />}
              {isReel ? 'Instagram reel' : orientation === 'portrait' ? 'YouTube short' : 'YouTube video'}
            </p>
            {isReel && !form.thumbnailUrl && fetchStatus.type === 'blocked' && (
              <p className="mt-1 text-xs text-amber-500">Add a thumbnail in Advanced below.</p>
            )}
          </div>
        </div>
      )}

      <Field label="Title" required>
        <input value={form.title} onChange={(e) => set('title', e.target.value)} required className={inputCls} />
      </Field>

      <Field label="Description" hint="Optional">
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-sm resize-y"
        />
      </Field>

      {/* Links & attachments — shown publicly under the reel/video */}
      <LinksEditor links={form.links} onChange={(links) => set('links', links)} />
      <AttachmentsEditor attachments={form.attachments} onChange={(attachments) => set('attachments', attachments)} />

      {/* Topic */}
      <Field label="Topic" hint="Groups it into a row on the view-all page">
        <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className={inputCls}>
          <option value="">No topic</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="flex gap-2 mt-2">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory() } }}
            placeholder="New topic name…"
            className={`${inputCls} flex-1`}
          />
          <button
            type="button"
            onClick={handleCreateCategory}
            disabled={creatingCategory || !newCategory.trim()}
            className="tap-scale px-3 h-11 text-sm rounded-xl border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] disabled:opacity-40 transition-colors font-medium whitespace-nowrap"
          >
            {creatingCategory ? '…' : '+ Add'}
          </button>
        </div>
      </Field>

      {/* Toggles */}
      <div className="grid sm:grid-cols-2 gap-3">
        <ToggleCard title="Featured" on={form.featured} onText="Shown first, in the Featured row." offText="Listed in its topic / recent row." onChange={(v) => set('featured', v)} />
        <ToggleCard title="Published" on={form.published} onText="Visible on the public site." offText="Hidden — only you can see it." onChange={(v) => set('published', v)} />
      </div>

      {/* Date added */}
      <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--foreground)]">Show date added</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {form.showDate ? 'Visitors see how recent it is on the card.' : 'No date shown on the public card.'}
            </p>
          </div>
          <Switch
            checked={form.showDate}
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                showDate: v,
                displayDate: v && !prev.displayDate ? todayStr() : prev.displayDate,
              }))
            }
            label="Show date added"
          />
        </div>
        {form.showDate && (
          <div className="mt-3">
            <label className="block text-xs text-[var(--muted)] mb-1.5">Date</label>
            <input
              type="date"
              value={form.displayDate}
              max={todayStr()}
              onChange={(e) => set('displayDate', e.target.value)}
              className={`${inputCls} max-w-[200px]`}
            />
          </div>
        )}
      </div>

      {/* Advanced — manual overrides, normally untouched */}
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="row-pressable w-full px-4 py-3 flex items-center justify-between text-left"
        >
          <span className="text-sm font-medium text-[var(--foreground)]">Advanced — custom thumbnail{isReel ? ' & preview clip' : ''}</span>
          <ChevronRight size={18} className="text-[var(--muted)] transition-transform" style={{ transform: advancedOpen ? 'rotate(90deg)' : 'none' }} />
        </button>
        {advancedOpen && (
          <div className="px-4 pb-4 pt-1 space-y-4 border-t border-[var(--border)]">
            <Field label="Thumbnail" hint={isReel ? 'Auto-fetched from Instagram' : 'Auto from YouTube'}>
              <div className="flex gap-2 items-stretch">
                <input value={form.thumbnailUrl} onChange={(e) => set('thumbnailUrl', e.target.value)} placeholder="https://… or upload" className={`${inputCls} flex-1`} />
                <label className="tap-scale cursor-pointer px-3 text-sm border border-[var(--border)] rounded-xl text-[var(--muted)] flex items-center gap-1.5 hover:border-[var(--accent)] hover:text-[var(--foreground)] transition-colors whitespace-nowrap">
                  <Upload size={15} />
                  {uploadingThumb ? '…' : 'Upload'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThumbUpload(f) }} />
                </label>
              </div>
            </Field>

            {isReel && (
              <Field label="Hover preview clip" hint="Optional MP4 — plays muted on hover">
                <div className="flex gap-2 items-stretch">
                  <input value={form.previewVideoUrl} onChange={(e) => set('previewVideoUrl', e.target.value)} placeholder="https://… or upload a short clip" className={`${inputCls} flex-1`} />
                  <label className="tap-scale cursor-pointer px-3 text-sm border border-[var(--border)] rounded-xl text-[var(--muted)] flex items-center gap-1.5 hover:border-[var(--accent)] hover:text-[var(--foreground)] transition-colors whitespace-nowrap">
                    <Upload size={15} />
                    {uploadingClip ? '…' : 'Upload'}
                    <input type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleClipUpload(f) }} />
                  </label>
                </div>
                {form.previewVideoUrl && (
                  <div className="mt-2 inline-flex items-center gap-2 text-xs text-green-500">
                    <CheckCircle2 size={13} /> Preview clip set
                    <button type="button" onClick={() => set('previewVideoUrl', '')} className="text-[var(--muted)] hover:text-red-500"><X size={13} /></button>
                  </div>
                )}
              </Field>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        className={`tap-scale w-full h-12 rounded-2xl text-white font-semibold transition-all disabled:opacity-50 ${saved ? 'bg-green-600' : 'bg-[var(--accent)] hover:opacity-90'}`}
      >
        {saving ? 'Saving…' : saved ? 'Saved!' : mediaId ? 'Update' : 'Add to site'}
      </button>
    </form>
  )
}

const inputCls =
  'w-full h-11 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-sm'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function FetchNote({ status, onRetry }: { status: FetchStatus; onRetry: () => void }) {
  if (status.type === 'ok') {
    return (
      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-green-500">
        <CheckCircle2 size={13} /> {status.message}
      </p>
    )
  }
  const amber = status.type === 'blocked'
  return (
    <div className={`mt-2 flex items-start gap-1.5 text-xs ${amber ? 'text-amber-500' : 'text-red-500'}`}>
      <AlertCircle size={13} className="mt-0.5 shrink-0" />
      <span>
        {status.message}{' '}
        <button type="button" onClick={onRetry} className="underline inline-flex items-center gap-1">
          <RefreshCw size={11} /> retry
        </button>
      </span>
    </div>
  )
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-baseline justify-between mb-1.5 gap-3">
        <span className="text-sm font-medium text-[var(--foreground)]">
          {label}
          {required && <span className="text-[var(--accent)] ml-0.5">*</span>}
        </span>
        {hint && <span className="text-xs text-[var(--muted)] truncate">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

function ToggleCard({ title, on, onText, offText, onChange }: { title: string; on: boolean; onText: string; offText: string; onChange: (v: boolean) => void }) {
  return (
    <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">{on ? onText : offText}</p>
        </div>
        <Switch checked={on} onChange={onChange} label={title} />
      </div>
    </div>
  )
}
