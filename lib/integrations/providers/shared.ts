import type { PublishInput } from '../types'
import { truncate } from '../html-to-markdown'

/**
 * Build the short broadcast text used by "announce" providers (X, Mastodon, Telegram,
 * Discord, …). Keeps a consistent voice everywhere: title, a trimmed summary, then the
 * canonical link. `maxLength` is the platform's hard character cap; the URL (and a few
 * spare chars) are reserved so the whole thing always fits.
 */
export function announceText(
  input: PublishInput,
  opts: { maxLength: number; includeUrl?: boolean; hashtags?: boolean } = { maxLength: 280 },
): string {
  const includeUrl = opts.includeUrl ?? true
  const url = includeUrl ? input.url : ''
  const tagLine = opts.hashtags && input.tags?.length
    ? '\n\n' + input.tags.slice(0, 4).map((t) => `#${t.replace(/[^a-zA-Z0-9]/g, '')}`).filter((t) => t.length > 1).join(' ')
    : ''

  // Reserve room for the URL + separators + hashtags.
  const reserved = (url ? url.length + 2 : 0) + tagLine.length
  const room = Math.max(20, opts.maxLength - reserved)

  const title = input.title.trim()
  const summary = input.summary?.trim() ?? ''
  let body = title
  if (summary && summary.toLowerCase() !== title.toLowerCase()) {
    body = `${title}\n\n${summary}`
  }
  body = truncate(body, room)

  return [body, url].filter(Boolean).join('\n\n') + tagLine
}

/** Build a normalized hashtag list from tag names (no leading #, alphanumeric only). */
export function hashtags(tags: string[] | undefined, limit = 5): string[] {
  if (!tags?.length) return []
  return tags
    .map((t) => t.replace(/[^a-zA-Z0-9]/g, ''))
    .filter((t) => t.length > 1)
    .slice(0, limit)
}
