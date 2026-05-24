// Used by the stdio server (src/mcp/server.ts) to call the hosted blog API.
// The hosted MCP endpoint at /mcp/ uses Prisma directly and does not need this.
const BASE_URL = (process.env.BLOG_API_URL ?? '').replace(/\/$/, '')
const TOKEN = process.env.MCP_ACCESS_TOKEN ?? ''

if (!BASE_URL) {
  console.error('[blog-mcp] BLOG_API_URL env var is not set')
}
if (!TOKEN) {
  console.error('[blog-mcp] MCP_ACCESS_TOKEN env var is not set')
}

type FetchOpts = {
  method?: string
  body?: unknown
}

export async function apiRequest<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { method = 'GET', body } = opts
  const url = `${BASE_URL}${path}`

  const headers: Record<string, string> = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/json',
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${method} ${path} → ${res.status}: ${text}`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function uploadFile(path: string, fileBlob: Blob, filename: string): Promise<{ url: string }> {
  const form = new FormData()
  form.append('file', fileBlob, filename)

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: form,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Upload ${path} → ${res.status}: ${text}`)
  }

  return res.json() as Promise<{ url: string }>
}
