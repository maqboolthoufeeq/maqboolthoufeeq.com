'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2, XCircle, ExternalLink, Sparkles, Zap } from 'lucide-react'
import Link from 'next/link'
import Modal from './Modal'
import ProviderIcon from './ProviderIcon'
import type { AdminIntegrationView } from '@/lib/integrations/store'

type ContentType = 'post' | 'hubItem' | 'hubTopic'
type Target = Pick<AdminIntegrationView, 'provider' | 'name' | 'icon' | 'brandColor' | 'capability'>
type Result = { provider: string; name: string; ok: boolean; remoteUrl?: string; error?: string }
type HistoryRow = { provider: string; status: string; remoteUrl: string | null; createdAt: string }

export default function CrossPostModal({
  contentType,
  contentId,
  title,
  onClose,
}: {
  contentType: ContentType
  contentId: string
  title?: string
  onClose: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [targets, setTargets] = useState<Target[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [publishing, setPublishing] = useState(false)
  const [results, setResults] = useState<Result[] | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const [intRes, histRes] = await Promise.all([
        fetch('/api/integrations').then((r) => r.json()).catch(() => ({ integrations: [] })),
        fetch(`/api/integrations/publish?contentType=${contentType}&contentId=${contentId}`).then((r) => r.json()).catch(() => ({ history: [] })),
      ])
      if (!active) return
      const available: Target[] = (intRes.integrations ?? []).filter(
        (v: AdminIntegrationView) => v.capability !== 'linkOnly' && v.connected && v.enabled,
      )
      setTargets(available)
      setSelected(new Set(available.map((t) => t.provider)))
      setHistory(histRes.history ?? [])
      setLoading(false)
    })()
    return () => { active = false }
  }, [contentType, contentId])

  const toggle = (provider: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(provider)) next.delete(provider)
      else next.add(provider)
      return next
    })

  async function publish() {
    setPublishing(true)
    setResults(null)
    try {
      const res = await fetch('/api/integrations/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, contentId, providers: Array.from(selected) }),
      })
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setResults([{ provider: '_', name: 'Request', ok: false, error: 'Network error' }])
    } finally {
      setPublishing(false)
    }
  }

  const lastByProvider = new Map(history.filter((h) => h.status === 'success').map((h) => [h.provider, h]))

  return (
    <Modal open title={<span className="flex items-center gap-2"><Sparkles size={16} className="text-[var(--accent)]" /> Publish everywhere</span>} onClose={onClose}>
      <div className="space-y-4">
        {title && <p className="text-sm text-[var(--muted)] truncate">&ldquo;{title}&rdquo;</p>}

        {loading ? (
          <div className="flex items-center justify-center py-10 text-[var(--muted)]"><Loader2 className="animate-spin" /></div>
        ) : targets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--foreground)] font-medium">No platforms connected yet</p>
            <p className="text-xs text-[var(--muted)] mt-1 mb-4">Connect and enable a platform to publish in one click.</p>
            <Link href="/admin/integrations" onClick={onClose} className="tap-scale inline-flex items-center h-10 px-5 rounded-full bg-[var(--accent)] text-white text-sm font-semibold">
              Set up integrations
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs text-[var(--muted)]">Choose where to publish. Blog platforms get the full article; others get a short post with the link.</p>
            <ul className="space-y-2">
              {targets.map((t) => {
                const last = lastByProvider.get(t.provider)
                const result = results?.find((r) => r.provider === t.provider)
                return (
                  <li key={t.provider}>
                    <label className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--border)] cursor-pointer hover:border-[var(--accent)] transition-colors">
                      <input
                        type="checkbox"
                        checked={selected.has(t.provider)}
                        onChange={() => toggle(t.provider)}
                        disabled={publishing}
                        className="w-4 h-4 accent-[var(--accent)]"
                      />
                      <ProviderIcon icon={t.icon} color={t.brandColor} size={18} />
                      <span className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-[var(--foreground)]">{t.name}</span>
                        <span className="block text-[10px] text-[var(--muted)] flex items-center gap-1">
                          {t.capability === 'autoPublish' ? <><Sparkles size={10} /> full article</> : <><Zap size={10} /> link post</>}
                          {last && <span className="text-emerald-600">· already shared</span>}
                        </span>
                      </span>
                      {result && (result.ok
                        ? <a href={result.remoteUrl ?? '#'} target="_blank" rel="noopener noreferrer" className="text-emerald-600 inline-flex items-center gap-1 text-xs"><CheckCircle2 size={14} /> {result.remoteUrl ? 'View' : 'Posted'} {result.remoteUrl && <ExternalLink size={11} />}</a>
                        : <span className="text-red-500 inline-flex items-center gap-1 text-xs" title={result.error}><XCircle size={14} /> Failed</span>
                      )}
                    </label>
                    {result && !result.ok && result.error && (
                      <p className="text-[11px] text-red-500/90 mt-1 ml-9 leading-snug">{result.error}</p>
                    )}
                  </li>
                )
              })}
            </ul>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={publish}
                disabled={publishing || selected.size === 0}
                className="tap-scale inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {publishing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {publishing ? 'Publishing…' : results ? 'Publish again' : `Publish to ${selected.size} platform${selected.size !== 1 ? 's' : ''}`}
              </button>
              <button onClick={onClose} className="h-10 px-4 rounded-full border border-[var(--border)] text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]">
                {results ? 'Done' : 'Cancel'}
              </button>
            </div>

            {results && (
              <p className="text-xs text-[var(--muted)]">
                {results.filter((r) => r.ok).length} succeeded · {results.filter((r) => !r.ok).length} failed.
              </p>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
