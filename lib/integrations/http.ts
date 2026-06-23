import ipaddr from 'ipaddr.js'

/**
 * Outbound HTTP helpers shared by every provider. Centralising this gives us one place
 * to enforce timeouts, body-size caps and SSRF protection, and to keep error messages
 * free of secrets.
 */

const DEFAULT_TIMEOUT_MS = 15_000
const MAX_RESPONSE_BYTES = 1_000_000 // 1 MB — provider APIs return small JSON

export class IntegrationError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = 'IntegrationError'
  }
}

/**
 * Reject URLs that aren't https or that resolve to a private / loopback / link-local
 * literal IP. Admin-entered instance + webhook URLs (Mastodon, Slack, Discord, …) flow
 * through here so a typo or a malicious value can't be used to reach internal services.
 * Host-name targets are allowed (the platforms are public SaaS); literal private IPs are
 * blocked outright.
 */
export function assertSafeUrl(rawUrl: string): URL {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new IntegrationError('Invalid URL')
  }
  if (url.protocol !== 'https:') {
    throw new IntegrationError('Only https:// URLs are allowed')
  }
  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new IntegrationError('Refusing to connect to a private host')
  }
  if (ipaddr.isValid(host)) {
    const range = ipaddr.process(host).range()
    if (range !== 'unicast') {
      throw new IntegrationError('Refusing to connect to a private or reserved IP address')
    }
  }
  return url
}

/** Optionally require the URL's host to be one of an allow-list (exact or suffix match). */
export function assertHostAllowed(url: URL, allowed: string[]): void {
  const host = url.hostname.toLowerCase()
  const ok = allowed.some((a) => host === a || host.endsWith(`.${a}`))
  if (!ok) throw new IntegrationError(`Host ${host} is not an allowed endpoint`)
}

interface FetchOptions {
  method?: string
  headers?: Record<string, string>
  body?: string
  timeoutMs?: number
  /** When set, the URL host must match one of these (suffix-aware). */
  allowedHosts?: string[]
}

/** Low-level guarded fetch: enforces https/SSRF, a timeout, and a response-size cap. */
export async function safeFetch(rawUrl: string, opts: FetchOptions = {}): Promise<{ status: number; text: string }> {
  const url = assertSafeUrl(rawUrl)
  if (opts.allowedHosts) assertHostAllowed(url, opts.allowedHosts)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: opts.method ?? 'GET',
      headers: opts.headers,
      body: opts.body,
      signal: controller.signal,
      redirect: 'error', // never follow a redirect to an unvetted host
    })
    const reader = res.body?.getReader()
    let received = 0
    const chunks: Uint8Array[] = []
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          received += value.length
          if (received > MAX_RESPONSE_BYTES) {
            controller.abort()
            throw new IntegrationError('Response too large')
          }
          chunks.push(value)
        }
      }
    }
    const text = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8')
    return { status: res.status, text }
  } catch (err) {
    if (err instanceof IntegrationError) throw err
    if (err instanceof Error && err.name === 'AbortError') {
      throw new IntegrationError('Request timed out')
    }
    throw new IntegrationError('Network request failed')
  } finally {
    clearTimeout(timer)
  }
}

/** POST/GET JSON and parse the response; throws IntegrationError with a clean message. */
export async function fetchJson<T = unknown>(
  rawUrl: string,
  opts: FetchOptions = {},
): Promise<{ status: number; data: T | null }> {
  const { status, text } = await safeFetch(rawUrl, opts)
  let data: T | null = null
  if (text) {
    try {
      data = JSON.parse(text) as T
    } catch {
      data = null
    }
  }
  return { status, data }
}

/** Pull the first usable error string out of a variety of provider error shapes. */
export function extractApiError(data: unknown, fallback = 'Request failed'): string {
  if (!data || typeof data !== 'object') return fallback
  const d = data as Record<string, unknown>
  const candidates = [d.error, d.message, d.error_description, d.detail, d.title]
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim().slice(0, 300)
  }
  // GraphQL-style { errors: [{ message }] }
  if (Array.isArray(d.errors) && d.errors[0] && typeof d.errors[0] === 'object') {
    const msg = (d.errors[0] as Record<string, unknown>).message
    if (typeof msg === 'string') return msg.slice(0, 300)
  }
  return fallback
}
