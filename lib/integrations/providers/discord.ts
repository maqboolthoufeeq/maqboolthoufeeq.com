import type { IntegrationProvider } from '../types'
import { fetchJson, safeFetch, extractApiError } from '../http'
import { truncate } from '../html-to-markdown'

/**
 * Discord — post an announcement embed to a channel via an Incoming Webhook (no OAuth,
 * no bot, no review). POST <webhook_url>?wait=true  body { content, embeds: [...] }.
 * Verified 2026-06-24 against docs.discord.com webhook resource (confidence: high).
 */
const WEBHOOK_HOSTS = ['discord.com', 'discordapp.com', 'ptb.discord.com', 'canary.discord.com']

export const discord: IntegrationProvider = {
  id: 'discord',
  name: 'Discord',
  category: 'community',
  capability: 'announce',
  icon: 'MessageCircle',
  brandColor: '#5865f2',
  fields: [
    {
      key: 'webhookUrl',
      label: 'Webhook URL',
      type: 'password',
      required: true,
      help: 'Server → Edit Channel → Integrations → Webhooks → New Webhook → Copy Webhook URL.',
    },
  ],
  docs: {
    summary: 'Posts a rich embed (title, summary, link, cover image) to a Discord channel.',
    steps: [
      'In your Discord server, open Server Settings → Integrations → Webhooks.',
      'Click "New Webhook", pick the target channel, and click "Copy Webhook URL".',
      'Paste the URL above. Treat it as a secret — anyone with it can post to that channel.',
    ],
    links: [{ label: 'Webhook docs', url: 'https://discord.com/developers/docs/resources/webhook' }],
    banSafety:
      'Incoming webhooks are the officially endorsed way to post to your own server — no ban risk. Don\'t reuse the URL to mass-post across servers, and never commit it to a public repo (Discord auto-revokes leaked webhooks).',
    scopes: 'No OAuth — a per-channel webhook token.',
  },
  async test({ credentials }) {
    // A GET on the webhook URL returns its metadata when the token is valid.
    const { status } = await safeFetch(credentials.webhookUrl ?? '', { allowedHosts: WEBHOOK_HOSTS })
    return status === 200
      ? { ok: true, message: 'Webhook is valid' }
      : { ok: false, message: status === 401 || status === 404 ? 'Invalid or deleted webhook URL' : `Discord returned ${status}` }
  },
  async publish(input, { credentials }) {
    const url = new URL(credentials.webhookUrl ?? '')
    url.searchParams.set('wait', 'true')
    const embed = {
      title: truncate(input.title, 240),
      description: input.summary ? truncate(input.summary, 1200) : undefined,
      url: input.url,
      color: 0x5865f2,
      ...(input.coverImageUrl ? { image: { url: input.coverImageUrl } } : {}),
    }
    const { status, data } = await fetchJson<{ id?: string; channel_id?: string }>(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input.url, embeds: [embed] }),
      allowedHosts: WEBHOOK_HOSTS,
    })
    if ((status === 200 || status === 204) && data?.id) {
      const link = data.channel_id ? `https://discord.com/channels/@me/${data.channel_id}/${data.id}` : undefined
      return { ok: true, remoteId: data.id, remoteUrl: link }
    }
    if (status === 204) return { ok: true }
    return { ok: false, error: extractApiError(data, `Discord returned ${status}`) }
  },
}
