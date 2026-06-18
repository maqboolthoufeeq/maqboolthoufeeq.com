'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Plus, Pencil, Trash2, Megaphone, Info, CheckCircle2, AlertTriangle, X, Eye, EyeOff,
} from 'lucide-react'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { BANNER_VARIANTS, type Banner, type BannerVariant } from '@/lib/banner-types'

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-sm'

const VARIANT_META: Record<BannerVariant, { icon: typeof Info; cls: string; label: string }> = {
  info: { icon: Info, cls: 'text-[var(--accent)]', label: 'Info' },
  success: { icon: CheckCircle2, cls: 'text-emerald-500', label: 'Success' },
  warning: { icon: AlertTriangle, cls: 'text-amber-500', label: 'Warning' },
  announcement: { icon: Megaphone, cls: 'text-fuchsia-500', label: 'Announcement' },
}

type Draft = {
  message: string
  variant: BannerVariant
  linkLabel: string
  linkUrl: string
  active: boolean
}

const EMPTY: Draft = { message: '', variant: 'info', linkLabel: '', linkUrl: '', active: true }

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function BannerManager() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState<Banner | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  async function load() {
    const res = await fetch('/api/banners')
    if (res.ok) setBanners(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  const closeForm = useCallback(() => {
    setFormOpen(false)
    setEditId(null)
    setDraft(EMPTY)
    setError('')
  }, [])

  function startCreate() {
    setEditId(null)
    setDraft(EMPTY)
    setError('')
    setFormOpen(true)
  }

  function startEdit(b: Banner) {
    setEditId(b.id)
    setDraft({
      message: b.message,
      variant: b.variant,
      linkLabel: b.linkLabel ?? '',
      linkUrl: b.linkUrl ?? '',
      active: b.active,
    })
    setError('')
    setFormOpen(true)
  }

  // Lock background scroll + close on Escape while the add/edit modal is open
  // (mirrors ConfirmDialog so the two admin modals behave identically).
  useEffect(() => {
    if (!formOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) closeForm() }
    window.addEventListener('keydown', onKey)
    const orig = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = orig
    }
  }, [formOpen, saving, closeForm])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.message.trim()) { setError('Message is required'); return }
    setSaving(true); setError('')

    const body = {
      message: draft.message.trim(),
      variant: draft.variant,
      linkLabel: draft.linkLabel.trim() || null,
      linkUrl: draft.linkUrl.trim() || null,
      active: draft.active,
    }

    const res = await fetch(editId ? `/api/banners/${editId}` : '/api/banners', {
      method: editId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (res.ok) {
      closeForm()
      load()
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'Failed to save announcement')
    }
  }

  async function toggleActive(b: Banner) {
    // Optimistic flip; reload to re-sync the "newest active wins" ordering.
    setBanners((prev) => prev.map((x) => (x.id === b.id ? { ...x, active: !x.active } : x)))
    await fetch(`/api/banners/${b.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !b.active }),
    })
    load()
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/banners/${pendingDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete-failed')
      if (editId === pendingDelete.id) closeForm()
    } catch {
      alert('Could not delete that announcement. Please try again.')
    } finally {
      setDeleting(false)
      setPendingDelete(null)
      load()
    }
  }

  const liveBanner = banners.find((b) => b.active) ?? null

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Currently live summary */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-xs uppercase tracking-wider text-[var(--muted)] font-medium mb-2">
          Live on the landing page
        </p>
        {liveBanner ? (
          <p className="text-sm text-[var(--foreground)]">{liveBanner.message}</p>
        ) : (
          <p className="text-sm text-[var(--muted)]">
            No active announcement — the top banner is hidden.
          </p>
        )}
      </div>

      {/* Add announcement — opens the create modal */}
      <button
        type="button"
        onClick={startCreate}
        className="tap-scale w-full inline-flex items-center justify-center gap-1.5 h-11 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Plus size={16} strokeWidth={2.4} /> Add announcement
      </button>

      {/* History */}
      <div>
        <h2 className="text-xs uppercase tracking-wider text-[var(--muted)] font-medium mb-3 px-1">
          History
        </h2>
        {loading ? (
          <p className="text-[var(--muted)] text-sm text-center py-8">Loading…</p>
        ) : banners.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] mb-3">
              <Megaphone size={26} />
            </div>
            <p className="text-[var(--foreground)] font-medium">No announcements yet</p>
            <p className="text-sm text-[var(--muted)] mt-1">Add one to show a notice on top of your landing page.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {banners.map((b) => {
              const meta = VARIANT_META[b.variant] ?? VARIANT_META.info
              const Icon = meta.icon
              return (
                <li key={b.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                  <div className="flex items-start gap-3 px-3 py-3">
                    <span className={`shrink-0 mt-0.5 ${meta.cls}`}><Icon size={18} /></span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold uppercase tracking-wide ${meta.cls}`}>{meta.label}</span>
                        {b.active && (
                          <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-500">
                            Live
                          </span>
                        )}
                        <span className="ml-auto text-xs text-[var(--muted)]">{formatDate(b.createdAt)}</span>
                      </div>
                      <p className="text-sm text-[var(--foreground)] mt-1 break-words">{b.message}</p>
                      {b.linkLabel && b.linkUrl && (
                        <p className="text-xs text-[var(--accent)] mt-1 truncate">{b.linkLabel} → {b.linkUrl}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex border-t border-[var(--border)] divide-x divide-[var(--border)]">
                    <button onClick={() => toggleActive(b)} className="row-pressable flex-1 h-11 flex items-center justify-center gap-1.5 text-sm font-medium text-[var(--foreground)]">
                      {b.active ? <><EyeOff size={15} /> Deactivate</> : <><Eye size={15} /> Set live</>}
                    </button>
                    <button onClick={() => startEdit(b)} className="row-pressable flex-1 h-11 flex items-center justify-center gap-1.5 text-sm font-medium text-[var(--accent)]">
                      <Pencil size={15} /> Edit
                    </button>
                    <button onClick={() => setPendingDelete(b)} className="row-pressable flex-1 h-11 flex items-center justify-center gap-1.5 text-sm font-medium text-red-500">
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Create / edit modal */}
      {formOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => { if (!saving) closeForm() }}
          role="dialog"
          aria-modal="true"
          aria-label={editId ? 'Edit announcement' : 'New announcement'}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[var(--foreground)]">
                {editId ? 'Edit announcement' : 'New announcement'}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Close"
                className="tap-scale -mr-1 w-8 h-8 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]"
              >
                <X size={18} />
              </button>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Message</label>
              <textarea
                value={draft.message}
                onChange={(e) => set('message', e.target.value)}
                rows={2}
                maxLength={280}
                placeholder="e.g. New blog post is live — read about my latest project!"
                className={`${inputCls} resize-y`}
              />
              <p className="text-xs text-[var(--muted)] mt-1">{draft.message.length}/280</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Style</label>
                <select value={draft.variant} onChange={(e) => set('variant', e.target.value as BannerVariant)} className={inputCls}>
                  {BANNER_VARIANTS.map((v) => (
                    <option key={v} value={v}>{VARIANT_META[v].label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => set('active', !draft.active)}
                  aria-pressed={draft.active}
                  className={[
                    'w-full inline-flex items-center justify-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-all',
                    draft.active
                      ? 'border-green-500/40 text-green-500 bg-green-500/10'
                      : 'border-[var(--border)] text-[var(--muted)]',
                  ].join(' ')}
                >
                  {draft.active ? <Eye size={15} /> : <EyeOff size={15} />}
                  {draft.active ? 'Shown at top' : 'Hidden'}
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Button label (optional)</label>
                <input value={draft.linkLabel} onChange={(e) => set('linkLabel', e.target.value)} placeholder="Read more" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Button link (optional)</label>
                <input value={draft.linkUrl} onChange={(e) => set('linkUrl', e.target.value)} placeholder="/blog or https://…" className={inputCls} />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={closeForm}
                className="tap-scale flex-1 h-11 rounded-xl border border-[var(--border)] text-[var(--foreground)] font-medium hover:bg-[var(--background)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !draft.message.trim()}
                className="tap-scale flex-1 inline-flex items-center justify-center gap-1.5 h-11 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Plus size={16} strokeWidth={2.4} />
                {saving ? 'Saving…' : editId ? 'Save changes' : 'Publish'}
              </button>
            </div>
            {draft.active && !editId && (
              <p className="text-xs text-[var(--muted)]">
                Publishing an active announcement replaces the one currently shown at the top of the site.
              </p>
            )}
          </form>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        busy={deleting}
        title="Delete announcement?"
        message="This permanently removes the announcement from the top banner and the public history. This can’t be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => { if (!deleting) setPendingDelete(null) }}
      />
    </div>
  )
}
