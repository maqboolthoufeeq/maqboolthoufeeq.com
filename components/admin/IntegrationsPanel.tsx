'use client'

import { useMemo, useState } from 'react'
import { ShieldCheck, Sparkles, Zap, Link as LinkIcon, ChevronRight, AlertTriangle } from 'lucide-react'
import ProviderIcon from './ProviderIcon'
import Switch from './Switch'
import ProviderConnectModal from './ProviderConnectModal'
import type { ProviderMeta } from '@/lib/integrations/registry'
import type { AdminIntegrationView } from '@/lib/integrations/store'

const CATEGORY_LABEL: Record<string, string> = {
  blog: 'Blogs & dev communities',
  social: 'Social networks',
  community: 'Chat & communities',
  newsletter: 'Newsletters',
  video: 'Video',
  qa: 'Q&A',
  review: 'Reviews',
  code: 'Code',
}
const CATEGORY_ORDER = ['blog', 'social', 'community', 'newsletter', 'video', 'qa', 'review', 'code']

function CapabilityBadge({ capability }: { capability: AdminIntegrationView['capability'] }) {
  if (capability === 'autoPublish') {
    return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600"><Sparkles size={11} /> Auto-publishes article</span>
  }
  if (capability === 'announce') {
    return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-600"><Zap size={11} /> Shares a link</span>
  }
  return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--muted)]"><LinkIcon size={11} /> Profile link only</span>
}

export default function IntegrationsPanel({
  initial,
  providerMeta,
  encryptionConfigured,
}: {
  initial: AdminIntegrationView[]
  providerMeta: ProviderMeta[]
  encryptionConfigured: boolean
}) {
  const [views, setViews] = useState<Record<string, AdminIntegrationView>>(
    () => Object.fromEntries(initial.map((v) => [v.provider, v])),
  )
  const [openProvider, setOpenProvider] = useState<string | null>(null)
  const metaById = useMemo(() => new Map(providerMeta.map((m) => [m.id, m])), [providerMeta])

  const grouped = useMemo(() => {
    const g: Record<string, AdminIntegrationView[]> = {}
    for (const v of initial) (g[v.category] ??= []).push(views[v.provider] ?? v)
    return g
  }, [initial, views])

  const connectedPublishable = initial.filter(
    (v) => v.capability !== 'linkOnly' && views[v.provider]?.connected && views[v.provider]?.enabled,
  ).length

  async function toggleEnabled(provider: string, enabled: boolean) {
    setViews((p) => ({ ...p, [provider]: { ...p[provider], enabled } }))
    await fetch(`/api/integrations/${provider}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    }).catch(() => null)
  }

  const openMeta = openProvider ? metaById.get(openProvider) : null
  const openView = openProvider ? views[openProvider] : null

  return (
    <div className="space-y-6">
      {/* Intro */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
          <Sparkles size={17} className="text-[var(--accent)]" /> One-click cross-publishing
        </h2>
        <p className="text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
          Connect the platforms below, then use <strong className="text-[var(--foreground)]">Publish everywhere</strong> on
          any blog post or hub item to syndicate it in one click. Blog platforms get the full article (canonical-linked
          back here for SEO); social and community platforms get a short post with the link.
        </p>
        <div className="flex gap-2.5 mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
          <ShieldCheck size={16} className="shrink-0 mt-0.5 text-emerald-500" />
          <p className="text-xs text-[var(--foreground)] leading-relaxed">
            Every platform listed here posts through its <strong>official API</strong> — platforms with no safe posting
            API are deliberately left out, so your accounts are never at risk of a ban. Credentials are encrypted at rest
            (AES-256-GCM) and never shown again after saving.
          </p>
        </div>
        {connectedPublishable > 0 && (
          <p className="text-xs text-[var(--muted)] mt-3">
            <strong className="text-[var(--accent)]">{connectedPublishable}</strong> platform{connectedPublishable !== 1 ? 's' : ''} ready for one-click publishing.
          </p>
        )}
      </section>

      {!encryptionConfigured && (
        <div className="flex gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 p-3">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-500" />
          <p className="text-xs text-[var(--foreground)]">
            No encryption key is configured. Set <code className="text-[var(--accent)]">AUTH_SECRET</code> (or{' '}
            <code className="text-[var(--accent)]">INTEGRATIONS_ENC_KEY</code>) before saving any credentials.
          </p>
        </div>
      )}

      {/* Grouped provider cards */}
      {CATEGORY_ORDER.filter((c) => grouped[c]?.length).map((cat) => (
        <section key={cat}>
          <h3 className="text-xs uppercase tracking-wider text-[var(--muted)] font-semibold mb-2.5 px-1">
            {CATEGORY_LABEL[cat] ?? cat}
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {grouped[cat].map((v) => (
              <li key={v.provider}>
                <div className="group flex items-center gap-3 p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] transition-colors">
                  <button
                    onClick={() => setOpenProvider(v.provider)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <ProviderIcon icon={v.icon} color={v.brandColor} size={20} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--foreground)] truncate">{v.name}</span>
                        {v.connected && (
                          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500" title="Connected" />
                        )}
                      </span>
                      <span className="block mt-0.5"><CapabilityBadge capability={v.capability} /></span>
                    </span>
                  </button>

                  {v.capability !== 'linkOnly' && v.connected ? (
                    <Switch checked={v.enabled} onChange={(n) => toggleEnabled(v.provider, n)} label={`Enable ${v.name}`} />
                  ) : (
                    <button
                      onClick={() => setOpenProvider(v.provider)}
                      className="shrink-0 text-xs font-medium text-[var(--muted)] hover:text-[var(--accent)] inline-flex items-center gap-0.5"
                    >
                      {v.connected ? 'Edit' : 'Connect'} <ChevronRight size={13} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {openMeta && openView && (
        <ProviderConnectModal
          meta={openMeta}
          view={openView}
          onClose={() => setOpenProvider(null)}
          onSaved={(updated) => { setViews((p) => ({ ...p, [updated.provider]: updated })); setOpenProvider(null) }}
          onDeleted={(provider) => {
            setViews((p) => ({ ...p, [provider]: { ...p[provider], connected: false, enabled: false, config: {}, meta: {} } }))
            setOpenProvider(null)
          }}
        />
      )}
    </div>
  )
}
