import type { IntegrationProvider } from '../types'
import { safeFetch } from '../http'
import { truncate } from '../html-to-markdown'

/**
 * Slack — post an announcement to a channel via an Incoming Webhook. This is the
 * ban-safe path: no OAuth token, no Marketplace review, scoped to one channel.
 * POST <webhook_url>  body { text, blocks }. A webhook returns the literal body "ok".
 * Verified 2026-06-24 against docs.slack.dev incoming-webhooks (confidence: high).
 */
export const slack: IntegrationProvider = {
  id: 'slack',
  name: 'Slack',
  category: 'community',
  capability: 'announce',
  icon: 'Slack',
  brandColor: '#4a154b',
  fields: [
    {
      key: 'webhookUrl',
      label: 'Incoming Webhook URL',
      type: 'password',
      required: true,
      help: 'api.slack.com/apps → your app → Incoming Webhooks → Add New Webhook to Workspace.',
    },
  ],
  docs: {
    summary: 'Posts a formatted message (title, summary, link) to a Slack channel.',
    steps: [
      'Go to api.slack.com/apps and create an app (or pick an existing one) in your workspace.',
      'Enable "Incoming Webhooks", click "Add New Webhook to Workspace", and choose a channel.',
      'Copy the generated webhook URL (starts with https://hooks.slack.com/services/…) and paste it above.',
    ],
    links: [
      { label: 'Create a Slack app', url: 'https://api.slack.com/apps' },
      { label: 'Incoming Webhooks', url: 'https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks' },
    ],
    banSafety:
      'Incoming webhooks are officially supported — safe for posting your own updates to your own workspace. Never commit the URL publicly (Slack scans for and revokes leaked webhooks) and don\'t use it for unsolicited bulk messaging.',
    scopes: 'No OAuth token needed — a per-channel incoming webhook (no Marketplace review for internal use).',
  },
  async test({ credentials }) {
    // No safe no-op exists; validate the URL shape + host instead of posting a test message.
    try {
      const url = new URL(credentials.webhookUrl ?? '')
      const ok = url.protocol === 'https:' && url.hostname === 'hooks.slack.com' && url.pathname.startsWith('/services/')
      return ok
        ? { ok: true, message: 'Webhook URL looks valid' }
        : { ok: false, message: 'Expected a https://hooks.slack.com/services/… URL' }
    } catch {
      return { ok: false, message: 'Invalid URL' }
    }
  },
  async publish(input, { credentials }) {
    const blocks = [
      { type: 'section', text: { type: 'mrkdwn', text: `*<${input.url}|${truncate(input.title, 200).replace(/[<>&]/g, '')}>*` } },
      ...(input.summary
        ? [{ type: 'section', text: { type: 'mrkdwn', text: truncate(input.summary, 600) } }]
        : []),
      { type: 'context', elements: [{ type: 'mrkdwn', text: input.url }] },
    ]
    const text = `${input.title} — ${input.url}`
    const { status } = await safeFetch(credentials.webhookUrl ?? '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, blocks }),
      allowedHosts: ['hooks.slack.com'],
    })
    if (status === 200) return { ok: true, remoteUrl: input.url }
    return { ok: false, error: status === 404 ? 'Webhook no longer exists' : `Slack returned ${status}` }
  },
}
