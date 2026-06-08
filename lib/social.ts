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

/** A related link an admin attaches to a reel/video (shown publicly, opens in a new tab). */
export interface MediaLink {
  label: string
  url: string
}

/** A downloadable/previewable file an admin attaches to a reel/video. */
export interface MediaAttachment {
  name: string
  url: string
  /** File size in bytes, when known. */
  size: number | null
  /** MIME type, when known — used to pick a preview affordance. */
  type: string | null
}

/** How many links / attachments a single item may hold (defensive, keeps the UI sane). */
export const MEDIA_LINK_LIMIT = 20
export const MEDIA_ATTACHMENT_LIMIT = 20

export type AttachmentKind = 'image' | 'video' | 'audio' | 'pdf' | 'doc'

/** Coarse file kind (from MIME, falling back to the extension) for icons & previews. */
export function attachmentKind(att: { name: string; type: string | null }): AttachmentKind {
  const t = att.type ?? ''
  if (t.startsWith('image/')) return 'image'
  if (t.startsWith('video/')) return 'video'
  if (t.startsWith('audio/')) return 'audio'
  if (t === 'application/pdf') return 'pdf'
  const ext = att.name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg'].includes(ext)) return 'image'
  if (['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(ext)) return 'video'
  if (['mp3', 'wav', 'm4a', 'aac', 'oga'].includes(ext)) return 'audio'
  if (ext === 'pdf') return 'pdf'
  return 'doc'
}

/** Human-readable file size, or null when the size is unknown. */
export function formatBytes(bytes: number | null | undefined): string | null {
  if (bytes == null) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
const MEDIA_LABEL_LIMIT = 120
const MEDIA_FILENAME_LIMIT = 200

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

/**
 * Normalise an admin-typed link URL: accept it as-is when it already has an
 * http(s) scheme, otherwise assume https:// (so "example.com/x" just works).
 * Returns null when the result still isn't a valid, short-enough http(s) URL —
 * which also defuses other schemes (javascript:, data:) by re-hosting them.
 */
function normalizeLinkUrl(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`
  return withScheme.length <= MEDIA_LIMITS.url && isHttpUrl(withScheme) ? withScheme : null
}

/**
 * Coerce arbitrary input (an API body or a stored JSON column) into a clean list
 * of links: each must have a valid http(s) URL; the label falls back to the URL.
 * Used in both directions so the same rules guard writes and reads.
 */
export function sanitizeMediaLinks(input: unknown): MediaLink[] {
  if (!Array.isArray(input)) return []
  const out: MediaLink[] = []
  for (const raw of input) {
    const rec = asRecord(raw)
    if (!rec) continue
    const url = normalizeLinkUrl(String(rec.url ?? ''))
    if (!url) continue
    let label = String(rec.label ?? '').trim()
    if (!label) label = url
    if (label.length > MEDIA_LABEL_LIMIT) label = label.slice(0, MEDIA_LABEL_LIMIT)
    out.push({ label, url })
    if (out.length >= MEDIA_LINK_LIMIT) break
  }
  return out
}

/**
 * Coerce arbitrary input into a clean list of attachments: each must have a valid
 * http(s) URL; name falls back to "Attachment"; size/type are kept when sane.
 */
export function sanitizeMediaAttachments(input: unknown): MediaAttachment[] {
  if (!Array.isArray(input)) return []
  const out: MediaAttachment[] = []
  for (const raw of input) {
    const rec = asRecord(raw)
    if (!rec) continue
    const url = String(rec.url ?? '').trim()
    if (!url || url.length > MEDIA_LIMITS.url || !isHttpUrl(url)) continue
    let name = String(rec.name ?? '').trim()
    if (!name) name = 'Attachment'
    if (name.length > MEDIA_FILENAME_LIMIT) name = name.slice(0, MEDIA_FILENAME_LIMIT)
    const size = typeof rec.size === 'number' && Number.isFinite(rec.size) && rec.size >= 0 ? Math.floor(rec.size) : null
    const type = typeof rec.type === 'string' && rec.type.length <= 100 ? rec.type : null
    out.push({ name, url, size, type })
    if (out.length >= MEDIA_ATTACHMENT_LIMIT) break
  }
  return out
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
