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
  origin: string
}

/** Redirect URIs the hosted Anthropic MCP connectors use — pre-filled so a client
 * created here works with claude.ai immediately. Mirrors DEFAULT_MCP_REDIRECT_URIS
 * in lib/oauth.ts. */
const DEFAULT_REDIRECT_URIS = [
  'https://claude.ai/api/mcp/auth_callback',
  'https://claude.com/api/mcp/auth_callback',
].join('\n')

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

/** Split a textarea (one URI per line) into a clean list. */
function parseRedirectUris(text: string): string[] {
  return text.split('\n').map((s) => s.trim()).filter(Boolean)
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

export default function McpPanel({ tokens: init, clients: initClients, disabledTools, origin }: Props) {
  const [tokens,  setTokens]  = useState<Token[]>(init)
  const [clients, setClients] = useState<Client[]>(initClients)

  // Token generation state
  const [genLabel,   setGenLabel]   = useState('')
  const [generating, setGenerating] = useState(false)
  const [newToken,   setNewToken]   = useState<{ token: string; label: string } | null>(null)

  // Client creation state
  const [showNewClient, setShowNewClient]   = useState(false)
  const [newClientName, setNewClientName]   = useState('')
  const [newClientRedirects, setNewClientRedirects] = useState(DEFAULT_REDIRECT_URIS)
  const [creatingClient, setCreatingClient] = useState(false)
  const [freshClient, setFreshClient]       = useState<{ clientId: string; clientSecret: string; name: string } | null>(null)

  // Per-client redirect-URI editing state (clientId being edited → textarea value).
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [editRedirects, setEditRedirects] = useState('')
  const [savingEdit, setSavingEdit]   = useState(false)

  const [provider, setProvider] = useState('claude-ai')

  const endpoint = `${origin}/mcp/`
  const desktopConfig = JSON.stringify({
    mcpServers: {
      'site-manager': {
        url: endpoint,
        headers: { Authorization: 'Bearer YOUR_ACCESS_TOKEN' },
      },
    },
  }, null, 2)
  const cursorConfig = JSON.stringify({
    mcpServers: {
      'site-manager': {
        url: endpoint,
        headers: { Authorization: 'Bearer YOUR_ACCESS_TOKEN' },
      },
    },
  }, null, 2)
  const claudeCodeCmd = `claude mcp add --transport http --header "Authorization: Bearer YOUR_TOKEN" site-manager ${endpoint}`
  const geminiConfig = JSON.stringify({
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
    if (!newClientName.trim()) return
    setCreatingClient(true)
    const res = await fetch('/api/oauth/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newClientName.trim(), redirectUrls: parseRedirectUris(newClientRedirects) }),
    })
    const data = await res.json()
    setFreshClient({ clientId: data.clientId, clientSecret: data.clientSecret, name: data.name })
    setClients((prev) => [{ id: data.id, name: data.name, clientId: data.clientId, redirectUrls: data.redirectUrls ?? [], createdAt: data.createdAt }, ...prev])
    setNewClientName('')
    setNewClientRedirects(DEFAULT_REDIRECT_URIS)
    setCreatingClient(false)
  }

  const startEditRedirects = (c: Client) => {
    setEditingId(c.clientId)
    setEditRedirects((c.redirectUrls.length ? c.redirectUrls : parseRedirectUris(DEFAULT_REDIRECT_URIS)).join('\n'))
  }

  const saveRedirects = async (c: Client) => {
    setSavingEdit(true)
    const res = await fetch('/api/oauth/clients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, redirectUrls: parseRedirectUris(editRedirects) }),
    })
    if (res.ok) {
      const data = await res.json()
      setClients((prev) => prev.map((x) => (x.id === c.id ? { ...x, redirectUrls: data.redirectUrls ?? [] } : x)))
      setEditingId(null)
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'Could not save redirect URIs')
    }
    setSavingEdit(false)
  }

  const closeCredentialsModal = () => {
    setFreshClient(null)
    setShowNewClient(false)
  }

  const downloadCredentialsJson = () => {
    if (!freshClient) return
    const json = JSON.stringify({
      client_id: freshClient.clientId,
      client_secret: freshClient.clientSecret,
      server_url: `${origin}/mcp`,
    }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${freshClient.name.replace(/\s+/g, '-').toLowerCase()}-mcp-credentials.json`
    a.click()
    URL.revokeObjectURL(url)
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

        <div className="mb-5">
          <p className="text-xs text-[var(--muted)] mb-1">MCP Endpoint</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--accent)] overflow-x-auto">
              {endpoint}
            </code>
            <CopyButton value={endpoint} />
          </div>
        </div>

        {/* Provider tabs */}
        <div className="flex overflow-x-auto border-b border-[var(--border)] mb-5 gap-0">
          {([
            ['claude-ai',      'Claude.ai'],
            ['claude-desktop', 'Claude Desktop'],
            ['chatgpt',        'ChatGPT'],
            ['gemini',         'Gemini'],
            ['claude-code',    'Claude Code'],
            ['cursor',         'Cursor'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setProvider(id)}
              className={`shrink-0 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                provider === id
                  ? 'border-[var(--accent)] text-[var(--foreground)]'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {provider === 'claude-ai' && (
          <div className="space-y-3 text-sm">
            <ol className="space-y-2 text-[var(--foreground)] list-decimal list-inside leading-relaxed">
              <li>Go to <strong>claude.ai</strong> → profile icon (bottom-left) → <strong>Customize</strong> → <strong>Connectors</strong></li>
              <li>Click <strong>+</strong> → <strong>Add custom connector</strong></li>
              <li>Paste the MCP Endpoint above as the <strong>Server URL</strong></li>
              <li>Expand <strong>Advanced settings</strong> → enter <strong>Client ID</strong> and <strong>Client Secret</strong> from the OAuth Clients section below</li>
              <li>Click <strong>Add</strong> and complete the sign-in prompt</li>
            </ol>
            <p className="text-xs text-[var(--muted)]">Requires Claude.ai Pro or Max plan. Your server must be publicly accessible over the internet.</p>
          </div>
        )}

        {provider === 'claude-desktop' && (
          <div className="space-y-3">
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-[var(--muted)]">Paste into <code className="text-[var(--accent)]">claude_desktop_config.json</code></p>
                <CopyButton value={desktopConfig} label="Copy JSON" />
              </div>
              <pre className="text-xs font-mono px-4 py-3 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] overflow-x-auto whitespace-pre-wrap">{desktopConfig}</pre>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[var(--muted)]">Replace <code className="text-[var(--accent)]">YOUR_ACCESS_TOKEN</code> with a token from Access Tokens below.</p>
              <p className="text-xs text-[var(--muted)]">Config location:</p>
              <p className="text-xs text-[var(--muted)] pl-3">macOS: <code className="text-[var(--foreground)]">~/Library/Application Support/Claude/claude_desktop_config.json</code></p>
              <p className="text-xs text-[var(--muted)] pl-3">Windows: <code className="text-[var(--foreground)]">%APPDATA%\Claude\claude_desktop_config.json</code></p>
            </div>
          </div>
        )}

        {provider === 'chatgpt' && (
          <div className="space-y-3 text-sm">
            <ol className="space-y-2 text-[var(--foreground)] list-decimal list-inside leading-relaxed">
              <li>Open <strong>ChatGPT</strong> desktop app (macOS/Windows) or go to <strong>chatgpt.com</strong></li>
              <li>Click your profile icon → <strong>Settings</strong> → <strong>Connectors</strong> (or <strong>Tools</strong>)</li>
              <li>Click <strong>Add MCP server</strong> (or <strong>+</strong>)</li>
              <li>Enter the MCP Endpoint above as the server URL</li>
              <li>Add a <strong>Bearer token</strong> header from the Access Tokens section below</li>
              <li>Save and enable the server in your conversation</li>
            </ol>
            <p className="text-xs text-[var(--muted)]">MCP support in ChatGPT requires a Plus, Pro, or Team plan. The desktop app has the most complete MCP support.</p>
          </div>
        )}

        {provider === 'gemini' && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-[var(--foreground)] mb-2">Gemini CLI</p>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-[var(--muted)]">Add to <code className="text-[var(--accent)]">~/.gemini/settings.json</code>:</p>
                  <CopyButton value={geminiConfig} label="Copy JSON" />
                </div>
                <pre className="text-xs font-mono px-4 py-3 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] overflow-x-auto whitespace-pre-wrap">{geminiConfig}</pre>
              </div>
              <p className="text-xs text-[var(--muted)] mt-2">Replace <code className="text-[var(--accent)]">YOUR_ACCESS_TOKEN</code> with a token from Access Tokens below. Start a session with <code className="text-[var(--accent)]">gemini</code>.</p>
            </div>
            <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
              <p className="text-xs font-medium text-[var(--foreground)] mb-1">Gemini web (gemini.google.com)</p>
              <p className="text-xs text-[var(--muted)]">The Gemini web app does not yet support user-configured remote MCP servers. Use Gemini CLI above, or check Google&apos;s latest release notes for web MCP support.</p>
            </div>
          </div>
        )}

        {provider === 'claude-code' && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-[var(--muted)]">1. Add the server:</p>
                <CopyButton value={claudeCodeCmd} />
              </div>
              <pre className="text-xs font-mono px-4 py-3 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] overflow-x-auto whitespace-pre">{claudeCodeCmd}</pre>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-[var(--muted)]">2. Verify it was added:</p>
                <CopyButton value="claude mcp list" />
              </div>
              <pre className="text-xs font-mono px-4 py-3 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]">claude mcp list</pre>
            </div>
            <p className="text-xs text-[var(--muted)]">Replace <code className="text-[var(--accent)]">YOUR_TOKEN</code> with a token from Access Tokens below.</p>
          </div>
        )}

        {provider === 'cursor' && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-[var(--muted)]">Add to <code className="text-[var(--accent)]">~/.cursor/mcp.json</code> (global) or <code className="text-[var(--accent)]">.cursor/mcp.json</code> in your project:</p>
                <CopyButton value={cursorConfig} label="Copy JSON" />
              </div>
              <pre className="text-xs font-mono px-4 py-3 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] overflow-x-auto whitespace-pre-wrap">{cursorConfig}</pre>
            </div>
            <p className="text-xs text-[var(--muted)]">Replace <code className="text-[var(--accent)]">YOUR_ACCESS_TOKEN</code> with a token from Access Tokens below. Restart Cursor after saving.</p>
          </div>
        )}
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
              ✓ Token generated — copy it now, it won&apos;t be shown again
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

      {/* ── OAuth Clients ──────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-[var(--foreground)]">OAuth Clients</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">For the authorization-code flow (advanced)</p>
          </div>
          <button
            onClick={() => { setShowNewClient(true); setNewClientName('') }}
            className="px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Create Credentials
          </button>
        </div>

        {clients.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No OAuth clients yet.</p>
        ) : (
          <div className="space-y-2">
            {clients.map((c) => (
              <div key={c.id} className="p-3 rounded-lg border border-[var(--border)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)]">{c.name}</p>
                    <p className="text-xs font-mono text-[var(--muted)] truncate">ID: {c.clientId}</p>
                    {c.redirectUrls.length > 0 ? (
                      <p className="text-xs text-[var(--muted)] truncate" title={c.redirectUrls.join(', ')}>
                        ↪ {c.redirectUrls.join(', ')}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-500">⚠ No redirect URIs — connector logins will fail</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 mt-0.5">
                    <button
                      onClick={() => (editingId === c.clientId ? setEditingId(null) : startEditRedirects(c))}
                      className="text-xs text-[var(--muted)] hover:text-[var(--accent)]"
                    >
                      {editingId === c.clientId ? 'Cancel' : 'Edit redirects'}
                    </button>
                    <button onClick={() => deleteClient(c.id)} className="text-xs text-red-400 hover:text-red-300">
                      Delete
                    </button>
                  </div>
                </div>
                {editingId === c.clientId && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      className={`${inputCls} font-mono text-xs`}
                      rows={2}
                      value={editRedirects}
                      onChange={(e) => setEditRedirects(e.target.value)}
                      placeholder="One redirect URI per line"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => saveRedirects(c)}
                        disabled={savingEdit}
                        className="px-3 py-1.5 text-xs bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {savingEdit ? 'Saving…' : 'Save redirect URIs'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Tools ──────────────────────────────────────────────────────────── */}
      <McpTools initialDisabled={disabledTools} />

      {/* ── Create Credentials Modal ───────────────────────────────────────── */}
      {showNewClient && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] w-full max-w-md shadow-2xl">
            {!freshClient ? (
              <div className="p-6 space-y-4">
                <h3 className="font-semibold text-[var(--foreground)] text-base">Create OAuth Credentials</h3>
                <input
                  className={inputCls}
                  placeholder="Name, e.g. My App"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createClient()}
                  autoFocus
                />
                <div>
                  <label className="block text-xs text-[var(--muted)] mb-1.5">
                    Redirect URIs <span className="text-[var(--muted)]">(one per line)</span>
                  </label>
                  <textarea
                    className={`${inputCls} font-mono text-xs`}
                    rows={2}
                    value={newClientRedirects}
                    onChange={(e) => setNewClientRedirects(e.target.value)}
                  />
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Pre-filled with Claude.ai&apos;s callback. The connector&apos;s login will fail unless its exact
                    redirect URI is listed here.
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowNewClient(false)}
                    className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createClient}
                    disabled={creatingClient || !newClientName.trim()}
                    className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {creatingClient ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <h3 className="font-semibold text-[var(--foreground)] text-base">Credentials Created</h3>
                <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10">
                  <p className="text-xs text-amber-400 font-medium">
                    Copy and save your Client Secret now. It will not be shown again after you close this dialog.
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-[var(--muted)] mb-1">Client ID</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] overflow-x-auto">
                        {freshClient.clientId}
                      </code>
                      <CopyButton value={freshClient.clientId} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted)] mb-1">Client Secret</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] break-all overflow-x-auto">
                        {freshClient.clientSecret}
                      </code>
                      <CopyButton value={freshClient.clientSecret} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    onClick={downloadCredentialsJson}
                    className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                  >
                    Download JSON
                  </button>
                  <button
                    onClick={closeCredentialsModal}
                    className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
