import type { IntegrationProvider } from '../types'
import { fetchJson, extractApiError } from '../http'
import { truncate } from '../html-to-markdown'

/**
 * Telegram — broadcast a post announcement to a channel/group via the official Bot API.
 * POST https://api.telegram.org/bot<TOKEN>/sendMessage  body { chat_id, text, parse_mode }.
 * Verified 2026-06-24 against core.telegram.org/bots/api (confidence: high).
 */
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const telegram: IntegrationProvider = {
  id: 'telegram',
  name: 'Telegram',
  category: 'social',
  capability: 'announce',
  icon: 'Send',
  brandColor: '#229ed9',
  fields: [
    { key: 'botToken', label: 'Bot token', type: 'password', required: true, help: 'From @BotFather → /newbot (format 123456:ABC...).' },
    { key: 'chatId', label: 'Chat / channel ID', type: 'text', required: true, secret: false, help: 'e.g. @mychannel or a numeric -100… id. Add the bot to the channel as admin first.' },
  ],
  docs: {
    summary: 'Posts a message with the title, summary and link to your Telegram channel or group.',
    steps: [
      'Open @BotFather in Telegram, send /newbot and follow the prompts to get a bot token.',
      'Create/choose a channel and add your bot as an administrator with "Post messages" permission.',
      'Use @your_channel as the Chat ID (public channel), or a numeric -100… id for a private one.',
    ],
    links: [
      { label: '@BotFather', url: 'https://t.me/BotFather' },
      { label: 'Bot API docs', url: 'https://core.telegram.org/bots/api' },
    ],
    banSafety:
      'The Bot API is the official, supported way to post — no ban risk for broadcasting your own content to your own channel. Never spam users who haven\'t messaged the bot; respect the ~20 msgs/min group limit. Keep your bot token secret.',
    scopes: 'No OAuth — a bot token created instantly via @BotFather.',
  },
  async test({ credentials }) {
    const token = credentials.botToken ?? ''
    const { status, data } = await fetchJson<{ ok?: boolean; result?: { username?: string } }>(
      `https://api.telegram.org/bot${encodeURIComponent(token)}/getMe`,
      { allowedHosts: ['api.telegram.org'] },
    )
    if (status === 200 && data?.ok && data.result?.username) {
      return { ok: true, message: `Connected as @${data.result.username}` }
    }
    return { ok: false, message: extractApiError(data, 'Invalid bot token') }
  },
  async publish(input, { credentials, config }) {
    const token = credentials.botToken ?? ''
    const chatId = config.chatId ?? ''
    const text =
      `<b>${escapeHtml(truncate(input.title, 240))}</b>\n\n` +
      (input.summary ? `${escapeHtml(truncate(input.summary, 600))}\n\n` : '') +
      `${escapeHtml(input.url)}`

    const { status, data } = await fetchJson<{ ok?: boolean; result?: { message_id?: number }; description?: string }>(
      `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: false }),
        allowedHosts: ['api.telegram.org'],
      },
    )
    if (status === 200 && data?.ok && data.result?.message_id != null) {
      const id = String(data.result.message_id)
      const handle = chatId.startsWith('@') ? chatId.slice(1) : null
      return { ok: true, remoteId: id, remoteUrl: handle ? `https://t.me/${handle}/${id}` : undefined }
    }
    return { ok: false, error: data?.description ?? extractApiError(data, `Telegram returned ${status}`) }
  },
}
