import type { IntegrationProvider, Connection, PublishInput, PublishResult } from '../types'
import { fetchJson, extractApiError } from '../http'
import { announceText } from './shared'

/**
 * Bluesky (AT Protocol) — post via an app password.
 * 1. createSession (identifier + app password) → accessJwt + did
 * 2. createRecord app.bsky.feed.post with an external embed (link card).
 * Verified 2026-06-24 against atproto.com (confidence: high). Use an APP PASSWORD
 * (Settings → App Passwords), never the main account password.
 */
function serviceBase(raw: string | undefined): string {
  const cleaned = (raw || 'bsky.social').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')
  return `https://${cleaned}`
}

async function createSession(base: string, identifier: string, password: string) {
  const { status, data } = await fetchJson<{ accessJwt?: string; did?: string; handle?: string }>(
    `${base}/xrpc/com.atproto.server.createSession`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    },
  )
  return { status, session: data }
}

export const bluesky: IntegrationProvider = {
  id: 'bluesky',
  name: 'Bluesky',
  category: 'social',
  capability: 'announce',
  icon: 'Cloud',
  brandColor: '#1185fe',
  fields: [
    { key: 'identifier', label: 'Handle', type: 'text', required: true, secret: false, help: 'e.g. yourname.bsky.social' },
    { key: 'appPassword', label: 'App password', type: 'password', required: true, help: 'Settings → Privacy & Security → App Passwords → Add. NOT your main password.' },
    { key: 'service', label: 'Service (advanced)', type: 'text', required: false, secret: false, help: 'Defaults to bsky.social; change only for a custom PDS.' },
  ],
  docs: {
    summary: 'Posts a status with a link card (title, summary, link) to your Bluesky account.',
    steps: [
      'In the Bluesky app, open Settings → Privacy & Security → App Passwords.',
      'Add a new app password and copy it (it is shown once).',
      'Paste your handle and the app password above.',
    ],
    links: [{ label: 'App passwords', url: 'https://bsky.app/settings/app-passwords' }],
    banSafety:
      'App passwords + the official XRPC API are the supported automation path. Avoid posting near-identical content in rapid succession; Bluesky\'s spam detection flags coordinated/bot-like bursts. Respect the ~1,666 posts/hour ceiling.',
    scopes: 'App password (scoped, revocable). No app review for basic posting.',
  },
  async test({ credentials, config }) {
    const base = serviceBase(config.service)
    const { status, session } = await createSession(base, config.identifier ?? '', credentials.appPassword ?? '')
    if (status === 200 && session?.accessJwt) return { ok: true, message: `Connected as @${session.handle ?? config.identifier}` }
    return { ok: false, message: status === 401 ? 'Invalid handle or app password' : `Bluesky returned ${status}` }
  },
  async publish(input: PublishInput, { credentials, config }: Connection): Promise<PublishResult> {
    const base = serviceBase(config.service)
    const { status, session } = await createSession(base, config.identifier ?? '', credentials.appPassword ?? '')
    if (status !== 200 || !session?.accessJwt || !session.did) {
      return { ok: false, error: status === 401 ? 'Invalid handle or app password' : `Auth failed (${status})` }
    }

    const text = announceText(input, { maxLength: 280, includeUrl: false, hashtags: false })
    const record = {
      $type: 'app.bsky.feed.post',
      text,
      createdAt: new Date().toISOString(),
      embed: {
        $type: 'app.bsky.embed.external',
        external: {
          uri: input.url,
          title: input.title.slice(0, 300),
          description: (input.summary ?? '').slice(0, 1000),
        },
      },
    }
    const { status: postStatus, data } = await fetchJson<{ uri?: string }>(
      `${base}/xrpc/com.atproto.repo.createRecord`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessJwt}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: session.did, collection: 'app.bsky.feed.post', record }),
      },
    )
    if (postStatus === 200 && data?.uri) {
      const rkey = data.uri.split('/').pop()
      const handle = session.handle ?? config.identifier
      return { ok: true, remoteId: data.uri, remoteUrl: rkey ? `https://bsky.app/profile/${handle}/post/${rkey}` : undefined }
    }
    return { ok: false, error: extractApiError(data, `Bluesky returned ${postStatus}`) }
  },
}
