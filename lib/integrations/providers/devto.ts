import type { IntegrationProvider } from '../types'
import { fetchJson, extractApiError } from '../http'

/**
 * dev.to (DEV Community / Forem) — full-article auto-publish.
 * POST https://dev.to/api/articles with header `api-key: <KEY>`.
 * Body: { article: { title, body_markdown, published, description, canonical_url, tags, main_image } }
 * Verified 2026-06-24 against developers.forem.com/api/v1 (confidence: high).
 */
export const devto: IntegrationProvider = {
  id: 'devto',
  name: 'DEV Community',
  category: 'blog',
  capability: 'autoPublish',
  icon: 'PenTool',
  brandColor: '#0a0a0a',
  fields: [
    {
      key: 'apiKey',
      label: 'API key',
      type: 'password',
      required: true,
      help: 'dev.to → Settings → Extensions → "DEV Community API Keys" → Generate API Key.',
    },
  ],
  docs: {
    summary: 'Publishes the full post as a Markdown article on your DEV account, with the canonical URL pointing back here.',
    steps: [
      'Sign in at dev.to and open Settings → Extensions.',
      'Scroll to "DEV Community API Keys", give it a name (e.g. "My site") and click Generate API Key.',
      'Copy the key and paste it above.',
    ],
    links: [
      { label: 'Generate API key', url: 'https://dev.to/settings/extensions' },
      { label: 'API docs', url: 'https://developers.forem.com/api/v1' },
    ],
    banSafety:
      'dev.to officially supports the API — there is no ban risk for posting your own original content. Keep it on-topic and non-spammy; the canonical URL is set automatically so you keep SEO authority and avoid duplicate-content penalties. Rate limit: ~10 article posts / 30s.',
    scopes: 'Single API key — no OAuth scopes or app review required.',
  },
  async test({ credentials }) {
    const { status, data } = await fetchJson('https://dev.to/api/users/me', {
      headers: { 'api-key': credentials.apiKey ?? '' },
      allowedHosts: ['dev.to'],
    })
    if (status === 200 && data && typeof data === 'object') {
      const username = (data as { username?: string }).username
      return { ok: true, message: username ? `Connected as @${username}` : 'Connected' }
    }
    return { ok: false, message: status === 401 ? 'Invalid API key' : extractApiError(data, 'Could not verify key') }
  },
  async publish(input, { credentials }) {
    const body = {
      article: {
        title: input.title,
        body_markdown: input.markdown ?? input.summary,
        published: true,
        description: input.summary?.slice(0, 250) || undefined,
        canonical_url: input.url,
        tags: (input.tags ?? []).map((t) => t.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()).filter(Boolean).slice(0, 4),
        main_image: input.coverImageUrl || undefined,
      },
    }
    const { status, data } = await fetchJson<{ url?: string; id?: number; error?: string }>(
      'https://dev.to/api/articles',
      {
        method: 'POST',
        headers: { 'api-key': credentials.apiKey ?? '', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        allowedHosts: ['dev.to'],
      },
    )
    if ((status === 201 || status === 200) && data?.url) {
      return { ok: true, remoteUrl: data.url, remoteId: data.id != null ? String(data.id) : undefined }
    }
    return { ok: false, error: extractApiError(data, `dev.to returned ${status}`) }
  },
}
