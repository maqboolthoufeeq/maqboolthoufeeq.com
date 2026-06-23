import type { IntegrationProvider } from '../types'
import { fetchJson, extractApiError } from '../http'
import { announceText } from './shared'

/**
 * X (Twitter) — post a tweet via API v2 with OAuth 2.0 (Authorization Code + PKCE).
 * Access tokens expire after ~2h, so we refresh with the rotating refresh token before
 * every post and hand the new tokens back to the orchestrator to persist.
 * POST https://api.x.com/2/tweets  header `Authorization: Bearer <token>`.
 * Verified 2026-06-24 against docs.x.com (confidence: high).
 *
 * NB: As of Feb 2026 the free tier is pay-per-use (a small per-post charge, more for
 * posts with links). This is the official, ban-safe path; cost is the user's call.
 */
const TOKEN_URL = 'https://api.x.com/2/oauth2/token'
const TWEET_URL = 'https://api.x.com/2/tweets'

async function refreshAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const { status, data } = await fetchJson<{ access_token?: string; refresh_token?: string; error?: string }>(TOKEN_URL, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: clientId }).toString(),
    allowedHosts: ['api.x.com'],
  })
  return { status, data }
}

export const x: IntegrationProvider = {
  id: 'x',
  name: 'X (Twitter)',
  category: 'social',
  capability: 'announce',
  icon: 'Twitter',
  brandColor: '#000000',
  fields: [
    { key: 'clientId', label: 'OAuth 2.0 Client ID', type: 'password', required: true, help: 'X developer portal → your app → Keys and tokens → OAuth 2.0 Client ID.' },
    { key: 'clientSecret', label: 'OAuth 2.0 Client Secret', type: 'password', required: true },
    { key: 'accessToken', label: 'Access token', type: 'password', required: true, help: 'From the OAuth2 authorization-code flow (scopes tweet.read tweet.write users.read offline.access).' },
    { key: 'refreshToken', label: 'Refresh token', type: 'password', required: true, help: 'Returned alongside the access token when offline.access is granted.' },
  ],
  docs: {
    summary: 'Posts a tweet with the title and link to your X account (auto-refreshing the OAuth token each time).',
    steps: [
      'Create a project + app in the X developer portal and enable OAuth 2.0 (User authentication).',
      'Set scopes tweet.read, tweet.write, users.read, offline.access and a redirect URL.',
      'Run the OAuth 2.0 authorization-code (PKCE) flow once to obtain an access token + refresh token.',
      'Paste the Client ID/Secret, access token and refresh token above.',
    ],
    links: [
      { label: 'X developer portal', url: 'https://developer.x.com/en/portal/dashboard' },
      { label: 'Manage Tweets API', url: 'https://docs.x.com/x-api/tweets/manage-tweets/api-reference/post-tweets' },
    ],
    banSafety:
      'Posting your own content through the official API is allowed. Don\'t auto-post at high frequency or duplicate identical tweets — X\'s spam detection flags that. A fully automated account should carry the "Automated" label in its profile. Free tier is pay-per-use as of Feb 2026.',
    scopes: 'tweet.write, users.read, offline.access. Developer account approval required; no per-app review for posting.',
  },
  async test({ credentials }) {
    const { status, data } = await refreshAccessToken(credentials.clientId ?? '', credentials.clientSecret ?? '', credentials.refreshToken ?? '')
    if (status === 200 && data?.access_token) return { ok: true, message: 'OAuth token refresh succeeded' }
    return { ok: false, message: extractApiError(data, status === 400 ? 'Invalid client or refresh token' : `X returned ${status}`) }
  },
  async publish(input, { credentials }) {
    const refreshed = await refreshAccessToken(credentials.clientId ?? '', credentials.clientSecret ?? '', credentials.refreshToken ?? '')
    if (refreshed.status !== 200 || !refreshed.data?.access_token) {
      return { ok: false, error: extractApiError(refreshed.data, 'Could not refresh X token (re-authorize the app)') }
    }
    const accessToken = refreshed.data.access_token
    const credentialUpdates: Record<string, string> = { accessToken }
    if (refreshed.data.refresh_token) credentialUpdates.refreshToken = refreshed.data.refresh_token

    const { status, data } = await fetchJson<{ data?: { id?: string }; detail?: string }>(TWEET_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: announceText(input, { maxLength: 280, hashtags: true }) }),
      allowedHosts: ['api.x.com'],
    })
    if (status === 201 && data?.data?.id) {
      return { ok: true, remoteId: data.data.id, remoteUrl: `https://x.com/i/web/status/${data.data.id}`, credentialUpdates }
    }
    // Still persist the refreshed tokens even on a post failure so they aren't lost.
    return { ok: false, error: extractApiError(data, `X returned ${status}`), credentialUpdates }
  },
}
