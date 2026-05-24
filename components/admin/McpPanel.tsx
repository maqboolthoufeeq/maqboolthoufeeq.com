'use client'
import { useState } from 'react'
import McpTools from './McpTools'

type Token = {
  id: string
  label: string
  createdAt: string
  expiresAt: string
  client: { name: string } | null
}

type Client = {
  id: string
  name: string
  clientId: string
  redirectUrls: string[]
  createdAt: string
}

interface Props {
  tokens: Token[]
  clients: Client[]
  disabledTools: string[]
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="text-xs px-2 py-1 rounded border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
    >
      {copied ? 'Copied!' : label}
    </button>
  )
}

export default function McpPanel({ tokens: init, clients: initClients, disabledTools }: Props) {
  const [tokens,  setTokens]  = useState<Token[]>(init)
  const [clients, setClients] = useState<Client[]>(initClients)

  // Token generation state
  const [genLabel,   setGenLabel]   = useState('')
  const [generating, setGenerating] = useState(false)
  const [newToken,   setNewToken]   = useState<{ token: string; label: string } | null>(null)

  // Client creation state
  const [showNewClient, setShowNewClient]       = useState(false)
  const [newClientName, setNewClientName]       = useState('')
  const [newClientRedirect, setNewClientRedirect] = useState('')
  const [creatingClient, setCreatingClient]     = useState(false)
  const [freshClient, setFreshClient]           = useState<{ clientId: string; clientSecret: string; name: string } | null>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'
  const endpoint = `${origin}/mcp/`
  const desktopConfig = JSON.stringify({
    mcpServers: {
      'site-manager': {
        url: endpoint,
        headers: { Authorization: 'Bearer YOUR_ACCESS_TOKEN' },
      },
    },
  }, null, 2)

  // ── Token actions ────────────────────────────────────────────────────────────
  const generateToken = async () => {
    if (!genLabel.trim()) return
    setGenerating(true)
    const res = await fetch('/api/admin/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: genLabel.trim() }),
    })
    const data = await res.json()
    setNewToken({ token: data.token, label: data.label })
    setTokens((prev) => [{ ...data, client: null }, ...prev])
    setGenLabel('')
    setGenerating(false)
  }

  const revokeToken = async (id: string) => {
    if (!confirm('Revoke this token? Any client using it will lose access.')) return
    await fetch(`/api/admin/mcp/tokens/${id}`, { method: 'DELETE' })
    setTokens((prev) => prev.filter((t) => t.id !== id))
  }

  // ── Client actions ───────────────────────────────────────────────────────────
  const createClient = async () => {
    if (!newClientName.trim() || !newClientRedirect.trim()) return
    setCreatingClient(true)
    const res = await fetch('/api/oauth/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newClientName.trim(), redirectUrls: [newClientRedirect.trim()] }),
    })
    const data = await res.json()
    setFreshClient({ clientId: data.clientId, clientSecret: data.clientSecret, name: data.name })
    setClients((prev) => [data, ...prev])
    setNewClientName('')
    setNewClientRedirect('')
    setShowNewClient(false)
    setCreatingClient(false)
  }

  const deleteClient = async (id: string) => {
    if (!confirm('Delete this OAuth client? All its tokens will be revoked.')) return
    await fetch('/api/oauth/clients', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setClients((prev) => prev.filter((c) => c.id !== id))
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-sm'

  return (
    <div className="space-y-6">

      {/* ── Connection ─────────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="font-semibold text-[var(--foreground)] mb-4">Connection</h2>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-[var(--muted)] mb-1">MCP Endpoint</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--accent)] overflow-x-auto">
                {endpoint}
              </code>
              <CopyButton value={endpoint} />
            </div>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)] mb-1">Claude Desktop Config <span className="text-[var(--accent)]">(paste into claude_desktop_config.json)</span></p>
            <div className="relative">
              <pre className="text-xs font-mono px-4 py-3 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] overflow-x-auto whitespace-pre-wrap">
                {desktopConfig}
              </pre>
              <div className="absolute top-2 right-2">
                <CopyButton value={desktopConfig} label="Copy JSON" />
              </div>
            </div>
            <p className="text-xs text-[var(--muted)] mt-1.5">
              Replace <code className="text-[var(--accent)]">YOUR_ACCESS_TOKEN</code> with a token generated below.
              Config file location: <code className="text-[var(--muted)]">~/Library/Application Support/Claude/claude_desktop_config.json</code>
            </p>
          </div>
        </div>
      </section>

      {/* ── Access Tokens ──────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="font-semibold text-[var(--foreground)] mb-4">Access Tokens</h2>

        {/* Generate form */}
        <div className="flex gap-2 mb-4">
          <input
            className={`${inputCls} flex-1`}
            placeholder="Token label, e.g. My Claude Desktop"
            value={genLabel}
            onChange={(e) => setGenLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generateToken()}
          />
          <button
            onClick={generateToken}
            disabled={generating || !genLabel.trim()}
            className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
          >
            {generating ? 'Generating…' : '+ Generate'}
          </button>
        </div>

        {/* Newly generated token — show once */}
        {newToken && (
          <div className="mb-4 p-4 rounded-lg border border-green-500/30 bg-green-500/5">
            <p className="text-xs font-medium text-green-400 mb-2">
              ✓ Token generated — copy it now, it won't be shown again
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono break-all text-[var(--foreground)]">{newToken.token}</code>
              <CopyButton value={newToken.token} label="Copy token" />
            </div>
            <button onClick={() => setNewToken(null)} className="mt-2 text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
              Dismiss
            </button>
          </div>
        )}

        {/* Token list */}
        {tokens.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No tokens yet. Generate one above.</p>
        ) : (
          <div className="rounded-lg border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--border)]">
                <tr className="text-left">
                  <th className="px-4 py-2 text-xs font-medium text-[var(--muted)]">Label</th>
                  <th className="px-4 py-2 text-xs font-medium text-[var(--muted)] hidden sm:table-cell">Via</th>
                  <th className="px-4 py-2 text-xs font-medium text-[var(--muted)] hidden sm:table-cell">Created</th>
                  <th className="px-4 py-2 text-xs font-medium text-[var(--muted)]">Expires</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {tokens.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 border-[var(--border)] hover:bg-[var(--background)] transition-colors">
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{t.label}</td>
                    <td className="px-4 py-3 text-[var(--muted)] hidden sm:table-cell">{t.client?.name ?? 'Admin panel'}</td>
                    <td className="px-4 py-3 text-[var(--muted)] hidden sm:table-cell">{fmt(t.createdAt)}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{fmt(t.expiresAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => revokeToken(t.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Tools ──────────────────────────────────────────────────────────── */}
      <McpTools initialDisabled={disabledTools} />

      {/* ── OAuth Clients ──────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">OAuth Clients</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">For the authorization-code flow (advanced)</p>
          </div>
          <button
            onClick={() => setShowNewClient((v) => !v)}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            {showNewClient ? 'Cancel' : '+ New client'}
          </button>
        </div>

        {showNewClient && (
          <div className="mb-4 p-4 rounded-lg border border-[var(--border)] space-y-3">
            <input className={inputCls} placeholder="Client name" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
            <input className={inputCls} placeholder="Redirect URL, e.g. http://localhost:3456/callback" value={newClientRedirect} onChange={(e) => setNewClientRedirect(e.target.value)} />
            <button
              onClick={createClient}
              disabled={creatingClient || !newClientName.trim() || !newClientRedirect.trim()}
              className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {creatingClient ? 'Creating…' : 'Create client'}
            </button>
          </div>
        )}

        {freshClient && (
          <div className="mb-4 p-4 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 space-y-2">
            <p className="text-xs font-medium text-[var(--accent)]">✓ Client created — save the secret now</p>
            <div className="flex items-center gap-2"><span className="text-xs text-[var(--muted)] w-24 shrink-0">Client ID</span><code className="flex-1 text-xs font-mono text-[var(--foreground)]">{freshClient.clientId}</code><CopyButton value={freshClient.clientId} /></div>
            <div className="flex items-center gap-2"><span className="text-xs text-[var(--muted)] w-24 shrink-0">Secret</span><code className="flex-1 text-xs font-mono text-[var(--foreground)] break-all">{freshClient.clientSecret}</code><CopyButton value={freshClient.clientSecret} /></div>
            <button onClick={() => setFreshClient(null)} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]">Dismiss</button>
          </div>
        )}

        {clients.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No OAuth clients.</p>
        ) : (
          <div className="space-y-2">
            {clients.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-4 p-3 rounded-lg border border-[var(--border)]">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">{c.name}</p>
                  <p className="text-xs font-mono text-[var(--muted)] truncate">ID: {c.clientId}</p>
                  <p className="text-xs text-[var(--muted)] truncate">{c.redirectUrls.join(', ')}</p>
                </div>
                <button onClick={() => deleteClient(c.id)} className="text-xs text-red-400 hover:text-red-300 shrink-0 mt-0.5">
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
