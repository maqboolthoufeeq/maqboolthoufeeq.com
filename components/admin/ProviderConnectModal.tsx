'use client'

import { useState } from 'react'
import { ExternalLink, ShieldCheck, Loader2, CheckCircle2, XCircle, Trash2 } from 'lucide-react'
import Modal from './Modal'
import ProviderIcon from './ProviderIcon'
import type { ProviderMeta } from '@/lib/integrations/registry'
import type { AdminIntegrationView } from '@/lib/integrations/store'

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-sm'

export default function ProviderConnectModal({
  meta,
  view,
  onClose,
  onSaved,
  onDeleted,
}: {
  meta: ProviderMeta
  view: AdminIntegrationView
  onClose: () => void
  onSaved: (v: AdminIntegrationView) => void
  onDeleted: (provider: string) => void
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    // Prefill non-secret config; leave secret fields blank (we only hold masked hints).
    const init: Record<string, string> = {}
    for (const f of meta.fields) {
      const isSecret = f.secret ?? f.type === 'password'
      if (!isSecret) init[f.key] = view.config[f.key] ?? ''
    }
    return init
  })
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [test, setTest] = useState<{ ok: boolean; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const set = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }))

  async function save() {
    setSaving(true)
    setError(null)
    setTest(null)
    try {
      const res = await fetch('/api/integrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: meta.id, values, enabled: view.enabled }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      onSaved(data as AdminIntegrationView)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function runTest() {
    setTesting(true)
    setTest(null)
    setError(null)
    try {
      const res = await fetch(`/api/integrations/${meta.id}/test`, { method: 'POST' })
      const data = await res.json()
      setTest({ ok: Boolean(data.ok), message: data.message ?? (data.ok ? 'OK' : 'Failed') })
    } catch {
      setTest({ ok: false, message: 'Test request failed' })
    } finally {
      setTesting(false)
    }
  }

  async function disconnect() {
    if (!confirm(`Disconnect ${meta.name}? Stored credentials will be deleted.`)) return
    setSaving(true)
    await fetch(`/api/integrations/${meta.id}`, { method: 'DELETE' })
    onDeleted(meta.id)
  }

  const isLinkOnly = meta.capability === 'linkOnly'

  return (
    <Modal open title={<span className="flex items-center gap-2"><ProviderIcon icon={meta.icon} color={meta.brandColor} size={16} badge={false} /> {meta.name}</span>} onClose={onClose}>
      <div className="space-y-5">
        {/* Capability + summary */}
        <p className="text-sm text-[var(--muted)]">{meta.docs.summary}</p>

        {/* Setup steps */}
        {meta.docs.steps.length > 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">Setup</p>
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-[var(--foreground)] leading-relaxed">
              {meta.docs.steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
            {meta.docs.links.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {meta.docs.links.map((l) => (
                  <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline">
                    {l.label} <ExternalLink size={12} />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ban-safety note */}
        <div className="flex gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
          <ShieldCheck size={16} className="shrink-0 mt-0.5 text-amber-500" />
          <p className="text-xs text-[var(--foreground)] leading-relaxed">
            {meta.docs.banSafety}
            {meta.docs.scopes ? <span className="block mt-1 text-[var(--muted)]">{meta.docs.scopes}</span> : null}
          </p>
        </div>

        {/* Field form */}
        {meta.fields.length > 0 && (
          <div className="space-y-3">
            {meta.fields.map((f) => {
              const isSecret = f.secret ?? f.type === 'password'
              const hint = view.meta[`${f.key}_hint`]
              return (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                    {f.label}{f.required ? <span className="text-red-500"> *</span> : null}
                  </label>
                  {f.type === 'textarea' ? (
                    <textarea
                      className={`${inputCls} min-h-[72px]`}
                      value={values[f.key] ?? ''}
                      onChange={(e) => set(f.key, e.target.value)}
                      placeholder={f.placeholder}
                    />
                  ) : (
                    <input
                      type={isSecret ? 'password' : f.type === 'url' ? 'url' : 'text'}
                      className={inputCls}
                      value={values[f.key] ?? ''}
                      onChange={(e) => set(f.key, e.target.value)}
                      placeholder={isSecret && hint ? `Saved ${hint} — leave blank to keep` : f.placeholder}
                      autoComplete="off"
                    />
                  )}
                  {f.help && <p className="text-[11px] text-[var(--muted)] mt-1 leading-snug">{f.help}</p>}
                </div>
              )
            })}
          </div>
        )}

        {/* Test result */}
        {test && (
          <div className={`flex items-center gap-2 rounded-lg p-2.5 text-sm ${test.ok ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>
            {test.ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
            {test.message}
          </div>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={save}
            disabled={saving}
            className="tap-scale inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : null}
            {view.connected ? 'Save changes' : isLinkOnly ? 'Save link' : 'Connect'}
          </button>
          {meta.hasTest && view.connected && (
            <button
              onClick={runTest}
              disabled={testing}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
            >
              {testing ? <Loader2 size={15} className="animate-spin" /> : null}
              Test connection
            </button>
          )}
          {view.connected && (
            <button
              onClick={disconnect}
              disabled={saving}
              className="ml-auto inline-flex items-center gap-1.5 h-10 px-3 rounded-full text-sm font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 size={14} /> Disconnect
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
