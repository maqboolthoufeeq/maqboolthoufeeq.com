import type { IntegrationProvider } from '../types'
import { fetchJson, extractApiError } from '../http'
import { truncate } from '../html-to-markdown'

/**
 * LinkedIn — share a post with an article link via the REST Posts API.
 * POST https://api.linkedin.com/rest/posts  header `Authorization: Bearer <token>` plus
 * `LinkedIn-Version: YYYYMM` and `X-Restli-Protocol-Version: 2.0.0`.
 * Verified 2026-06-24 against learn.microsoft.com LinkedIn Posts API (confidence: high).
 *
 * Access tokens last ~60 days; LinkedIn requires "Share on LinkedIn" app review for
 * production. The author URN identifies the posting member/org (urn:li:person:… / org:…).
 */
const POSTS_URL = 'https://api.linkedin.com/rest/posts'
// LinkedIn versions are dated (YYYYMM). Kept current; bump as LinkedIn deprecates versions.
const LINKEDIN_VERSION = '202506'

export const linkedin: IntegrationProvider = {
  id: 'linkedin',
  name: 'LinkedIn',
  category: 'social',
  capability: 'announce',
  icon: 'Linkedin',
  brandColor: '#0a66c2',
  fields: [
    { key: 'accessToken', label: 'Access token', type: 'password', required: true, help: 'OAuth 2.0 access token with the w_member_social scope (lasts ~60 days).' },
    { key: 'authorUrn', label: 'Author URN', type: 'text', required: true, secret: false, help: 'urn:li:person:XXXX for your profile, or urn:li:organization:1234 for a company page.' },
  ],
  docs: {
    summary: 'Posts an update with the title, summary and an article link to your LinkedIn feed or company page.',
    steps: [
      'Create an app at the LinkedIn developer portal and request the "Share on LinkedIn" product (requires app review).',
      'Run the OAuth 2.0 flow with scope w_member_social (or w_organization_social for a page) to get an access token.',
      'Find your author URN: urn:li:person:{id} (from the userinfo endpoint) or urn:li:organization:{id}.',
      'Paste the access token and author URN above. Re-paste a fresh token roughly every 60 days.',
    ],
    links: [
      { label: 'Developer portal', url: 'https://developer.linkedin.com/' },
      { label: 'Posts API docs', url: 'https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api' },
    ],
    banSafety:
      'Post only your own content, vary the wording, and keep well under LinkedIn\'s limits (stay around 20–30 posts/day max). LinkedIn analyses posting "rhythm" and bans headless-browser automation — this uses the official API, which is compliant. Never scrape.',
    scopes: 'w_member_social (profile) or w_organization_social (page). "Share on LinkedIn" app review required.',
  },
  async test({ credentials, config }) {
    // Validate the token + URN shape; LinkedIn has no cheap idempotent verify for posting.
    const urn = config.authorUrn ?? ''
    if (!/^urn:li:(person|organization):.+/.test(urn)) {
      return { ok: false, message: 'Author URN must look like urn:li:person:… or urn:li:organization:…' }
    }
    const { status, data } = await fetchJson('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${credentials.accessToken ?? ''}` },
      allowedHosts: ['api.linkedin.com'],
    })
    if (status === 200) return { ok: true, message: 'Access token is valid' }
    return { ok: false, message: status === 401 ? 'Access token is invalid or expired' : extractApiError(data, `LinkedIn returned ${status}`) }
  },
  async publish(input, { credentials, config }) {
    const body = {
      author: config.authorUrn,
      commentary: truncate(`${input.title}\n\n${input.summary ?? ''}`.trim(), 2900),
      visibility: 'PUBLIC',
      distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
      content: {
        article: {
          source: input.url,
          title: truncate(input.title, 200),
          description: input.summary ? truncate(input.summary, 250) : undefined,
          ...(input.coverImageUrl ? {} : {}),
        },
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    }
    const { status, data } = await fetchJson<{ id?: string }>(POSTS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.accessToken ?? ''}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': LINKEDIN_VERSION,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
      allowedHosts: ['api.linkedin.com'],
    })
    // The created post id comes back in the x-restli-id header (not the JSON body); the
    // body is empty on success. A 201 is the success signal.
    if (status === 201) {
      const id = data && typeof data === 'object' && 'id' in data ? String((data as { id?: string }).id) : undefined
      return { ok: true, remoteId: id, remoteUrl: id ? `https://www.linkedin.com/feed/update/${id}/` : undefined }
    }
    return { ok: false, error: extractApiError(data, status === 401 ? 'Access token expired — reconnect LinkedIn' : `LinkedIn returned ${status}`) }
  },
}
