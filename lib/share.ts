export type SharePayload = {
  /** Absolute, canonical URL of the page being shared. */
  url: string
  /** Title of the content. */
  title: string
  /** Optional longer text/description used where the platform supports it. */
  text?: string
}

export type ShareTarget =
  | 'linkedin'
  | 'facebook'
  | 'whatsapp'
  | 'twitter'
  | 'telegram'
  | 'reddit'
  | 'email'

/**
 * Build platform-specific share URLs. Each platform crawls the shared URL
 * server-side and renders the Open Graph / Twitter card metadata (title,
 * description, image) that the page exposes — which is why those URLs only
 * need the canonical link.
 *
 * Note: Instagram has no public web share URL. On mobile, the native Web Share
 * API (navigator.share) surfaces Instagram and every other installed app; the
 * UI falls back to these links on platforms without it.
 */
export function buildShareLinks({ url, title, text }: SharePayload): Record<ShareTarget, string> {
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)
  const body = text?.trim() ? text.trim() : title

  return {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}`,
    twitter: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
    telegram: `https://t.me/share/url?url=${u}&text=${t}`,
    reddit: `https://www.reddit.com/submit?url=${u}&title=${t}`,
    email: `mailto:?subject=${t}&body=${encodeURIComponent(`${body}\n\n${url}`)}`,
  }
}
