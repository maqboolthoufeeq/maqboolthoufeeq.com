import type { ReactElement } from 'react'

/**
 * Shared building blocks for the dynamically generated Open Graph / Twitter
 * card images (1200x630 — the size LinkedIn, Facebook, WhatsApp and X expect).
 *
 * Used by both the per-post card (`/blog/[slug]/og`) and the site-wide default
 * card (`/og`). Every element follows Satori's constraints: inline styles only,
 * and any node with multiple children declares `display: flex`.
 */

export const OG_SIZE = { width: 1200, height: 630 } as const

export const OG_CACHE_HEADERS = {
  // Let the CDN / crawlers cache the generated card while allowing refreshes.
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
} as const

/**
 * Generic fallbacks for the share-card branding. Real values are resolved per
 * request from admin-editable content (`getSeo`) and passed in as props, so a
 * deployed site shows its own identity; these only apply if a caller omits them.
 */
const FALLBACK_DOMAIN = 'example.com'
const FALLBACK_AUTHOR = 'Your Name'
const FALLBACK_ROLE = 'Portfolio'

/** Branding shown on the card footer — resolved from site identity (`getSeo`). */
export type OgBrand = {
  author?: string
  role?: string
  domain?: string
}

// Upper bound on the source cover image we'll inline. Generous for real photos
// but blocks an admin-set 50MB image from bloating the card / exhausting memory
// or blowing past crawler image limits (LinkedIn ~5MB, Facebook ~8MB).
const MAX_IMAGE_BYTES = 8_000_000

/**
 * Fetch a remote image and inline it as a base64 data URI so the rendered card
 * is always served from our own domain. Returns null when the source is
 * missing, not an image, empty, too large, or unreachable — callers then
 * render a branded card instead.
 */
export async function fetchImageAsDataUri(src: string | null | undefined): Promise<string | null> {
  if (!src || !/^https?:\/\//i.test(src)) return null
  try {
    const res = await fetch(src, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return null
    const type = res.headers.get('content-type') || ''
    if (!type.startsWith('image/')) return null
    // Cheap pre-check via the declared length, then enforce on the real bytes
    // (Content-Length may be absent or wrong).
    const declared = Number(res.headers.get('content-length'))
    if (Number.isFinite(declared) && declared > MAX_IMAGE_BYTES) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.byteLength === 0 || buf.byteLength > MAX_IMAGE_BYTES) return null
    return `data:${type};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

/** A featured-image card: the cover photo full-bleed with a title overlay. */
export function CoverOgCard({ cover, title, domain, author }: { cover: string; title: string } & OgBrand): ReactElement {
  const brandDomain = domain || FALLBACK_DOMAIN
  const brandAuthor = author || FALLBACK_AUTHOR
  return (
    <div style={{ position: 'relative', display: 'flex', width: '100%', height: '100%' }}>
      {/* Satori requires a raw img element; next/image is not supported here. */}
      <img
        src={cover}
        alt=""
        width={OG_SIZE.width}
        height={OG_SIZE.height}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '70px',
          background: 'linear-gradient(180deg, rgba(8,8,12,0.05) 35%, rgba(8,8,12,0.92) 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1, maxWidth: 1040, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
          {title}
        </div>
        <div style={{ marginTop: 24, fontSize: 28, color: '#e2e8f0' }}>
          {/* Single text node: Satori rejects multiple children without display:flex. */}
          {`${brandDomain} · ${brandAuthor}`}
        </div>
      </div>
    </div>
  )
}

/** A branded gradient card used as the fallback / default when there's no cover. */
export function BrandedOgCard({ title, subtitle, domain, author, role }: { title: string; subtitle?: string } & OgBrand): ReactElement {
  const brandDomain = domain || FALLBACK_DOMAIN
  const brandAuthor = author || FALLBACK_AUTHOR
  const brandRole = role || FALLBACK_ROLE
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #0d0d0f 0%, #1a1a2e 100%)',
        padding: '80px',
        color: '#f1f5f9',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', fontSize: 30, color: '#94a3b8' }}>
        {brandDomain}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1, maxWidth: 1000 }}>{title}</div>
        {subtitle ? (
          <div style={{ marginTop: 28, fontSize: 32, color: '#cbd5e1', lineHeight: 1.4, maxWidth: 980 }}>
            {subtitle}
          </div>
        ) : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', fontSize: 28, color: '#94a3b8' }}>
        {`By ${brandAuthor} · ${brandRole}`}
      </div>
    </div>
  )
}
