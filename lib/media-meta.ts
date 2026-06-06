import { put } from '@vercel/blob'
import crypto from 'crypto'
import type { Platform } from './social'

/**
 * Server-side metadata fetching for pasted reel / video URLs, so the admin
 * never has to type a title or upload a thumbnail. Uses the public oEmbed
 * endpoints (no API key): YouTube's oEmbed and Instagram's web oEmbed. Instagram
 * thumbnails are re-hosted on Vercel Blob because the original CDN URLs are
 * signed and expire.
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
// Public web client id Instagram itself sends from the browser oEmbed call.
const IG_APP_ID = '936619743392459'

export interface FetchedMeta {
  title: string | null
  description: string | null
  thumbnailUrl: string | null
  author: string | null
  /** True when the source explicitly blocked us (e.g. age-restricted reel). */
  blocked?: boolean
  blockedReason?: string | null
}

function emptyMeta(): FetchedMeta {
  return { title: null, description: null, thumbnailUrl: null, author: null }
}

/** First non-empty line of a caption, trimmed to a tidy title length. */
function firstLine(text: string, max = 90): string {
  const line = text.split('\n').map((s) => s.trim()).find(Boolean) ?? text.trim()
  if (line.length <= max) return line
  return line.slice(0, max).replace(/\s+\S*$/, '').trim() + '…'
}

/** Truncate on a word boundary, preserving newlines (unlike a plain excerpt). */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const sliced = text.slice(0, max)
  const lastSpace = sliced.lastIndexOf(' ')
  return (lastSpace > max * 0.6 ? sliced.slice(0, lastSpace) : sliced).trimEnd() + '…'
}

/** Title + author from YouTube's keyless oEmbed endpoint. */
async function fetchYouTubeOembed(id: string): Promise<FetchedMeta> {
  try {
    const target = `https://www.youtube.com/watch?v=${id}`
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(target)}&format=json`, {
      headers: { 'User-Agent': UA },
    })
    if (!res.ok) return emptyMeta()
    const j = (await res.json()) as { title?: string; author_name?: string }
    return {
      title: j.title?.trim() || null,
      description: null,
      thumbnailUrl: null, // YouTube thumbnails derive from the id (stable)
      author: j.author_name?.trim() || null,
    }
  } catch {
    return emptyMeta()
  }
}

/**
 * Full video description, scraped from the watch page's `shortDescription`
 * (oEmbed doesn't expose it). Capped to a sensible length; admin can trim.
 */
async function fetchYouTubeDescription(id: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${id}`, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
    })
    if (!res.ok) return null
    const html = await res.text()
    const m = html.match(/"shortDescription":"((?:\\.|[^"\\])*)"/)
    if (!m) return null
    let text: string
    try {
      text = JSON.parse(`"${m[1]}"`)
    } catch {
      return null
    }
    text = text.trim()
    return text ? truncate(text, 2000) : null
  } catch {
    return null
  }
}

export async function fetchYouTubeMeta(id: string): Promise<FetchedMeta> {
  const [meta, description] = await Promise.all([fetchYouTubeOembed(id), fetchYouTubeDescription(id)])
  return { ...meta, description }
}

export async function fetchInstagramMeta(shortcode: string): Promise<FetchedMeta> {
  try {
    const target = `https://www.instagram.com/reel/${shortcode}/`
    const res = await fetch(`https://i.instagram.com/api/v1/oembed/?url=${encodeURIComponent(target)}`, {
      headers: { 'User-Agent': UA, 'X-IG-App-ID': IG_APP_ID, Accept: '*/*' },
    })
    const j = (await res.json().catch(() => null)) as
      | { title?: string; author_name?: string; thumbnail_url?: string; message?: string }
      | null

    if (!res.ok || !j) {
      // Instagram returns a JSON message for age-gated / private content.
      return { ...emptyMeta(), blocked: true, blockedReason: j?.message ?? null }
    }

    const caption = typeof j.title === 'string' ? j.title.trim() : ''
    const author = j.author_name?.trim() || null
    return {
      title: caption ? firstLine(caption) : author ? `Reel by @${author}` : null,
      description: caption || null,
      thumbnailUrl: j.thumbnail_url || null,
      author,
    }
  } catch {
    return emptyMeta()
  }
}

/**
 * Download a remote image and re-host it on Vercel Blob so it never expires or
 * breaks on hotlink protection. Returns the permanent URL, or null on failure.
 */
export async function mirrorImageToBlob(srcUrl: string): Promise<string | null> {
  try {
    const res = await fetch(srcUrl, { headers: { 'User-Agent': UA } })
    if (!res.ok) return null
    const type = res.headers.get('content-type') || 'image/jpeg'
    if (!type.startsWith('image/')) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length === 0 || buf.length > 8 * 1024 * 1024) return null
    const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg'
    const { url } = await put(`media-thumbs/${crypto.randomBytes(16).toString('hex')}.${ext}`, buf, {
      access: 'public',
      contentType: type,
    })
    return url
  } catch {
    return null
  }
}

/**
 * Fetch metadata for a platform/id and, for Instagram, re-host the thumbnail.
 * The returned `thumbnailUrl` is always safe to store long-term.
 */
export async function fetchMediaMeta(platform: Platform, embedId: string): Promise<FetchedMeta> {
  const meta = platform === 'youtube' ? await fetchYouTubeMeta(embedId) : await fetchInstagramMeta(embedId)

  if (platform === 'instagram' && meta.thumbnailUrl) {
    const mirrored = await mirrorImageToBlob(meta.thumbnailUrl)
    // Prefer the permanent Blob copy; keep the raw URL only as a last resort.
    meta.thumbnailUrl = mirrored ?? meta.thumbnailUrl
  }

  return meta
}
