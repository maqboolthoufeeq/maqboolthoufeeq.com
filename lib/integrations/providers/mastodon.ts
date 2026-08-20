import type { IntegrationProvider } from '../types'
import { fetchJson, extractApiError, assertSafeUrl } from '../http'
import { announceText } from './shared'

/**
 * Mastodon — post a status (toot) to the admin's account on any instance.
 * POST https://<instance>/api/v1/statuses  header `Authorization: Bearer <token>`.
 * Verified 2026-06-24 against docs.joinmastodon.org/methods/statuses (confidence: high).
 */
function instanceBase(domain: string): string {
  const cleaned = domain.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')
  return `https://${cleaned}`
}

export const mastodon: IntegrationProvider = {
  id: 'mastodon',
  name: 'Mastodon',
  category: 'social',
  capability: 'announce',
  icon: 'AtSign',
  brandColor: '#6364ff',
  fields: [
    { key: 'instance', label: 'Instance domain', type: 'text', required: true, secret: false, help: 'e.g. mastodon.social (your server\'s domain).' },
    { key: 'accessToken', label: 'Access token', type: 'password', required: true, help: 'Your instance → Preferences → Development → New application → copy "Your access token".' },
  ],
  docs: {
    summary: 'Posts a public status with the title, summary and link to your Mastodon account.',
    steps: [
      'On your Mastodon instance, open Preferences → Development → New application.',
      'Give it a name and tick the write:statuses scope, then create it.',
      'Open the application and copy "Your access token". Paste it plus your instance domain above.',
    ],
    links: [{ label: 'Mastodon API docs', url: 'https://docs.joinmastodon.org/methods/statuses/' }],
    banSafety:
      'Posting to your own account via the official API is fine. Each instance has its own rules — keep it on-topic and non-spammy; aggressive bots can be rate-limited or suspended by an instance\'s moderators. A unique idempotency key is sent to avoid accidental duplicate toots.',
    scopes: 'write:statuses (set when you create the application). No central app review.',
  },
  async test({ credentials, config }) {
    const base = instanceBase(config.instance ?? '')
    try {
      assertSafeUrl(base)
    } catch {
      return { ok: false, message: 'Invalid instance domain' }
    }
    const { status, data } = await fetchJson<{ username?: string; acct?: string }>(
      `${base}/api/v1/accounts/verify_credentials`,
      { headers: { Authorization: `Bearer ${credentials.accessToken ?? ''}` } },
    )
    if (status === 200 && data?.username) return { ok: true, message: `Connected as @${data.acct ?? data.username}` }
    return { ok: false, message: status === 401 ? 'Invalid access token' : extractApiError(data, 'Could not verify') }
  },
  async publish(input, { credentials, config }) {
    const base = instanceBase(config.instance ?? '')
    const idempotencyKey = `${input.contentType}:${input.contentId}`
    const { status, data } = await fetchJson<{ id?: string; url?: string }>(`${base}/api/v1/statuses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.accessToken ?? ''}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({ status: announceText(input, { maxLength: 480, hashtags: true }), visibility: 'public' }),
    })
    if (status === 200 && data?.url) return { ok: true, remoteUrl: data.url, remoteId: data.id }
    return { ok: false, error: extractApiError(data, `Mastodon returned ${status}`) }
  },
}
