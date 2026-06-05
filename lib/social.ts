/**
 * Helpers for turning the raw Instagram / YouTube URLs an admin pastes into
 * stable embed ids, thumbnail URLs and iframe sources. Pure functions only —
 * safe to import on both the server (API validation) and the client (live
 * preview in the form, player in the modal).
 */

export type Platform = 'instagram' | 'youtube'

export const PLATFORMS: Platform[] = ['instagram', 'youtube']

export function isPlatform(value: unknown): value is Platform {
  return value === 'instagram' || value === 'youtube'
}

/** Orientation of a platform's player: Instagram reels are portrait, YouTube landscape. */
export function orientationFor(platform: Platform): 'portrait' | 'landscape' {
  return platform === 'instagram' ? 'portrait' : 'landscape'
}

/** Tailwind aspect-ratio class for a platform's card/player. */
export function aspectClassFor(platform: Platform): string {
  return platform === 'instagram' ? 'aspect-[9/16]' : 'aspect-video'
}

export type Orientation = 'portrait' | 'landscape'

/** True for a YouTube Shorts URL (vertical 9:16 video). */
export function isYouTubeShortUrl(url: string | null | undefined): boolean {
  return !!url && /\/shorts\//i.test(url)
}

/**
 * Display orientation for an actual item: Instagram reels and YouTube Shorts are
 * portrait (9:16); regular YouTube videos are landscape (16:9). Derived from the
 * original URL so Shorts render vertically without a schema change.
 */
export function mediaOrientation(platform: Platform, sourceUrl?: string | null): Orientation {
  if (platform === 'instagram') return 'portrait'
  return isYouTubeShortUrl(sourceUrl) ? 'portrait' : 'landscape'
}

/** Tailwind aspect-ratio class for a given orientation. */
export function aspectClassForOrientation(orientation: Orientation): string {
  return orientation === 'portrait' ? 'aspect-[9/16]' : 'aspect-video'
}

const YOUTUBE_ID = /^[a-zA-Z0-9_-]{11}$/

function extractYouTubeId(raw: string): string | null {
  if (YOUTUBE_ID.test(raw)) return raw
  const match = raw.match(/[a-zA-Z0-9_-]{11}/)
  return match ? match[0] : null
}

/**
 * Extract the 11-character video id from any common YouTube URL form:
 * watch?v=, youtu.be/, /shorts/, /embed/, /v/, /live/, or a bare id.
 */
export function parseYouTubeId(url: string): string | null {
  const value = url?.trim()
  if (!value) return null

  try {
    const u = new URL(value)
    const host = u.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      return extractYouTubeId(u.pathname.split('/').filter(Boolean)[0] ?? '')
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const v = u.searchParams.get('v')
      if (v) return extractYouTubeId(v)

      const parts = u.pathname.split('/').filter(Boolean)
      const idx = parts.findIndex((p) => ['embed', 'shorts', 'v', 'live'].includes(p))
      if (idx !== -1 && parts[idx + 1]) return extractYouTubeId(parts[idx + 1])
    }

    return null
  } catch {
    // Not a URL — accept a bare id pasted on its own.
    return YOUTUBE_ID.test(value) ? value : null
  }
}

const IG_SHORTCODE = /^[A-Za-z0-9_-]+$/

/**
 * Extract the shortcode from an Instagram reel / post / IGTV URL:
 * /reel/CODE/, /reels/CODE/, /p/CODE/, /tv/CODE/. Also accepts a bare shortcode.
 */
export function parseInstagramShortcode(url: string): string | null {
  const value = url?.trim()
  if (!value) return null

  try {
    const u = new URL(value)
    const host = u.hostname.replace(/^www\./, '')
    // Exact host only — mirrors parseYouTubeId and avoids subdomain spoofing.
    if (host !== 'instagram.com') return null

    const parts = u.pathname.split('/').filter(Boolean)
    const idx = parts.findIndex((p) => ['reel', 'reels', 'p', 'tv'].includes(p))
    if (idx !== -1 && parts[idx + 1]) {
      const code = parts[idx + 1]
      return IG_SHORTCODE.test(code) ? code : null
    }
    return null
  } catch {
    return IG_SHORTCODE.test(value) && !value.includes('.') ? value : null
  }
}

/** Sniff which platform a pasted URL belongs to (YouTube wins ties). */
export function detectPlatform(url: string): Platform | null {
  if (parseYouTubeId(url)) return 'youtube'
  if (parseInstagramShortcode(url)) return 'instagram'
  return null
}

/** Parse the embed id for a known platform, or null if the URL doesn't match. */
export function parseEmbedId(platform: Platform, url: string): string | null {
  return platform === 'youtube' ? parseYouTubeId(url) : parseInstagramShortcode(url)
}

/**
 * True when a value is empty or an http(s) URL. Rejects data:, file:,
 * javascript: and other schemes for admin-entered thumbnail / preview URLs.
 */
export function isHttpUrl(value: string | null | undefined): boolean {
  if (!value || !value.trim()) return true
  try {
    const u = new URL(value.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/** Max accepted lengths for admin-supplied media fields (defensive, DoS-safe). */
export const MEDIA_LIMITS = {
  title: 200,
  description: 5000,
  url: 2048,
} as const

/** Returns an error message if any media field exceeds its limit, else null. */
export function mediaLengthError(fields: {
  title?: unknown
  description?: unknown
  sourceUrl?: unknown
  thumbnailUrl?: unknown
  previewVideoUrl?: unknown
}): string | null {
  const str = (v: unknown) => (typeof v === 'string' ? v : '')
  if (str(fields.title).length > MEDIA_LIMITS.title) return `Title must be under ${MEDIA_LIMITS.title} characters`
  if (str(fields.description).length > MEDIA_LIMITS.description) return 'Description is too long'
  if (str(fields.sourceUrl).length > MEDIA_LIMITS.url) return 'URL is too long'
  if (str(fields.thumbnailUrl).length > MEDIA_LIMITS.url) return 'Thumbnail URL is too long'
  if (str(fields.previewVideoUrl).length > MEDIA_LIMITS.url) return 'Preview clip URL is too long'
  return null
}

type YouTubeThumbQuality = 'maxres' | 'sd' | 'hq' | 'mq'

const YT_THUMB_FILE: Record<YouTubeThumbQuality, string> = {
  maxres: 'maxresdefault',
  sd: 'sddefault',
  hq: 'hqdefault',
  mq: 'mqdefault',
}

/** YouTube auto-thumbnail. `hq` (480×360) always exists; `maxres` may 404. */
export function youTubeThumbnail(id: string, quality: YouTubeThumbQuality = 'hq'): string {
  return `https://i.ytimg.com/vi/${id}/${YT_THUMB_FILE[quality]}.jpg`
}

export interface YouTubeEmbedOptions {
  autoplay?: boolean
  mute?: boolean
  /** Defaults to true; pass false for a chromeless hover preview. */
  controls?: boolean
  loop?: boolean
}

/** Privacy-friendly (nocookie) YouTube embed URL. */
export function youTubeEmbedUrl(id: string, opts: YouTubeEmbedOptions = {}): string {
  const params = new URLSearchParams()
  if (opts.autoplay) params.set('autoplay', '1')
  if (opts.mute) params.set('mute', '1')
  params.set('controls', opts.controls === false ? '0' : '1')
  if (opts.loop) {
    params.set('loop', '1')
    params.set('playlist', id) // required for loop on a single video
  }
  params.set('playsinline', '1')
  params.set('rel', '0')
  params.set('modestbranding', '1')
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`
}

/** Instagram iframe embed URL for a reel/post shortcode. */
export function instagramEmbedUrl(shortcode: string, captioned = false): string {
  return `https://www.instagram.com/reel/${shortcode}/embed/${captioned ? 'captioned/' : ''}`
}

/** Canonical public permalink for a media item (for "open on platform" links). */
export function permalinkFor(platform: Platform, embedId: string): string {
  return platform === 'youtube'
    ? `https://www.youtube.com/watch?v=${embedId}`
    : `https://www.instagram.com/reel/${embedId}/`
}

/**
 * Best thumbnail URL for a card: the admin's custom upload wins; otherwise
 * YouTube derives one automatically and Instagram has none (caller shows a
 * branded placeholder).
 */
export function resolveThumbnail(
  platform: Platform,
  embedId: string,
  custom?: string | null,
  quality: YouTubeThumbQuality = 'hq',
): string | null {
  if (custom) return custom
  if (platform === 'youtube') return youTubeThumbnail(embedId, quality)
  return null
}
