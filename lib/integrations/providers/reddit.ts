import type { IntegrationProvider } from '../types'
import { fetchJson, extractApiError } from '../http'

/**
 * Reddit — submit a link post via the official API (OAuth2 "script" / password grant).
 * 1. POST https://www.reddit.com/api/v1/access_token (Basic client_id:client_secret,
 *    grant_type=password) → short-lived bearer token (fetched fresh each post).
 * 2. POST https://oauth.reddit.com/api/submit (kind=link).
 * Verified 2026-06-24 (confidence: high). A descriptive User-Agent is REQUIRED, and as
 * of Nov 2025 Reddit requires app pre-approval even for personal scripts.
 */
async function getToken(conn: { clientId: string; clientSecret: string; username: string; password: string; userAgent: string }) {
  const basic = Buffer.from(`${conn.clientId}:${conn.clientSecret}`).toString('base64')
  const { status, data } = await fetchJson<{ access_token?: string; error?: string }>(
    'https://www.reddit.com/api/v1/access_token',
    {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': conn.userAgent },
      body: new URLSearchParams({ grant_type: 'password', username: conn.username, password: conn.password }).toString(),
      allowedHosts: ['reddit.com'],
    },
  )
  return { status, token: data?.access_token, error: data?.error }
}

export const reddit: IntegrationProvider = {
  id: 'reddit',
  name: 'Reddit',
  category: 'community',
  capability: 'announce',
  icon: 'MessageSquare',
  brandColor: '#ff4500',
  fields: [
    { key: 'clientId', label: 'Client ID', type: 'password', required: true, help: 'reddit.com/prefs/apps → create a "script" app → the id under the app name.' },
    { key: 'clientSecret', label: 'Client secret', type: 'password', required: true },
    { key: 'username', label: 'Reddit username', type: 'password', required: true, help: 'The account that will post (no leading u/).' },
    { key: 'password', label: 'Reddit password', type: 'password', required: true, help: 'Account password. 2FA accounts must use an app password.' },
    { key: 'subreddit', label: 'Default subreddit', type: 'text', required: true, secret: false, help: 'Where to post, e.g. your profile: u_yourname, or a community you\'re allowed to post in.' },
    { key: 'userAgent', label: 'User-Agent', type: 'text', required: false, secret: false, help: 'e.g. "mysite/1.0 by u/yourname". Required by Reddit; a default is used if blank.' },
  ],
  docs: {
    summary: 'Submits a link post (title + canonical URL) to a subreddit — your own profile by default.',
    steps: [
      'Go to reddit.com/prefs/apps and create an app of type "script".',
      'Note the client id (under the app name) and the secret.',
      'As of Nov 2025, apply for API access approval at reddit.com/dev/api-docs describing your use case.',
      'Paste the id, secret, your username/password, and a target subreddit (e.g. u_yourname for your profile).',
    ],
    links: [
      { label: 'Create app', url: 'https://www.reddit.com/prefs/apps' },
      { label: 'API rules', url: 'https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy' },
    ],
    banSafety:
      'Reddit is strict: keep self-promotion under ~10% of your activity, never cross-post the same link to many subreddits, and always follow each community\'s rules. Posting only to your own profile (u_yourname) is the safest default. A descriptive User-Agent is mandatory.',
    scopes: 'submit, identity (script grant). App pre-approval required since Nov 2025.',
  },
  async test({ credentials, config }) {
    const { status, token, error } = await getToken({
      clientId: credentials.clientId ?? '', clientSecret: credentials.clientSecret ?? '',
      username: credentials.username ?? '', password: credentials.password ?? '',
      userAgent: config.userAgent || `maqbool-site/1.0 by u/${credentials.username ?? 'unknown'}`,
    })
    if (status === 200 && token) return { ok: true, message: 'Authenticated with Reddit' }
    return { ok: false, message: error === 'invalid_grant' ? 'Wrong username/password (use an app password if 2FA is on)' : `Reddit auth failed (${status})` }
  },
  async publish(input, { credentials, config }) {
    const userAgent = config.userAgent || `maqbool-site/1.0 by u/${credentials.username ?? 'unknown'}`
    const { status, token } = await getToken({
      clientId: credentials.clientId ?? '', clientSecret: credentials.clientSecret ?? '',
      username: credentials.username ?? '', password: credentials.password ?? '', userAgent,
    })
    if (status !== 200 || !token) return { ok: false, error: `Reddit auth failed (${status})` }

    const { status: subStatus, data } = await fetchJson<{ json?: { data?: { url?: string; name?: string }; errors?: unknown[] } }>(
      'https://oauth.reddit.com/api/submit',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': userAgent },
        body: new URLSearchParams({ sr: config.subreddit ?? '', title: input.title, url: input.url, kind: 'link', api_type: 'json', resubmit: 'true' }).toString(),
        allowedHosts: ['reddit.com'],
      },
    )
    const errors = data?.json?.errors
    if (subStatus === 200 && Array.isArray(errors) && errors.length === 0 && data?.json?.data?.url) {
      return { ok: true, remoteUrl: data.json.data.url, remoteId: data.json.data.name }
    }
    const firstErr = Array.isArray(errors) && errors[0] ? JSON.stringify(errors[0]).slice(0, 200) : `Reddit returned ${subStatus}`
    return { ok: false, error: extractApiError(data, firstErr) }
  },
}
