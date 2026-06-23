import type { IntegrationProvider } from '../types'
import { fetchJson, extractApiError } from '../http'
import { truncate } from '../html-to-markdown'

/**
 * Facebook Page — publish a link post to a Page feed via the Graph API.
 * POST https://graph.facebook.com/v21.0/<page-id>/feed  body { message, link, access_token }.
 * Verified 2026-06-24 against developers.facebook.com Pages API (confidence: high).
 *
 * PAGES ONLY — posting to a personal profile was removed (publish_actions deprecated).
 * Requires a long-lived Page access token and pages_manage_posts (app review needed).
 */
const GRAPH_VERSION = 'v21.0'

export const facebook: IntegrationProvider = {
  id: 'facebook',
  name: 'Facebook Page',
  category: 'social',
  capability: 'announce',
  icon: 'Facebook',
  brandColor: '#1877f2',
  fields: [
    { key: 'pageId', label: 'Page ID', type: 'text', required: true, secret: false, help: 'Your Facebook Page → About → Page transparency, or via the Graph API Explorer.' },
    { key: 'pageAccessToken', label: 'Page access token', type: 'password', required: true, help: 'A long-lived Page access token with pages_manage_posts.' },
  ],
  docs: {
    summary: 'Posts a link with a short message to your Facebook Page feed (Pages only — not personal profiles).',
    steps: [
      'Create an app at developers.facebook.com and add the "Facebook Login" + Pages products.',
      'Request pages_manage_posts, pages_read_engagement and pages_show_list (these need app review for production).',
      'Generate a long-lived Page access token for the Page you manage (via Graph API Explorer → exchange for long-lived).',
      'Paste the Page ID and the long-lived Page access token above.',
    ],
    links: [
      { label: 'Developer portal', url: 'https://developers.facebook.com/' },
      { label: 'Page feed API', url: 'https://developers.facebook.com/docs/pages-api/posts/' },
    ],
    banSafety:
      'Only post to Pages you own/manage with consent — programmatic posting to personal timelines is forbidden and will get the app restricted. Don\'t pre-fill spammy content or post in bulk across pages. This uses the official Graph API, which is compliant for your own Page.',
    scopes: 'pages_manage_posts, pages_read_engagement, pages_show_list. App review required.',
  },
  async test({ credentials, config }) {
    const { status, data } = await fetchJson<{ name?: string; error?: { message?: string } }>(
      `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(config.pageId ?? '')}?fields=name&access_token=${encodeURIComponent(credentials.pageAccessToken ?? '')}`,
      { allowedHosts: ['graph.facebook.com'] },
    )
    if (status === 200 && data?.name) return { ok: true, message: `Connected to "${data.name}"` }
    return { ok: false, message: data?.error?.message ?? extractApiError(data, `Facebook returned ${status}`) }
  },
  async publish(input, { credentials, config }) {
    const message = truncate(`${input.title}\n\n${input.summary ?? ''}`.trim(), 600)
    const { status, data } = await fetchJson<{ id?: string; error?: { message?: string } }>(
      `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(config.pageId ?? '')}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, link: input.url, access_token: credentials.pageAccessToken }),
        allowedHosts: ['graph.facebook.com'],
      },
    )
    if (status === 200 && data?.id) {
      const postId = data.id.includes('_') ? data.id.split('_')[1] : data.id
      return { ok: true, remoteId: data.id, remoteUrl: `https://www.facebook.com/${config.pageId}/posts/${postId}` }
    }
    return { ok: false, error: data?.error?.message ?? extractApiError(data, `Facebook returned ${status}`) }
  },
}
