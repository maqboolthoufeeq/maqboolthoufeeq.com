import { ImageResponse } from 'next/og'
import sharp from 'sharp'
import { getSiteContent, getSeo } from '@/lib/site-content'

// Let Google / the CDN / browsers cache the favicon so the URL stays stable
// (Google won't display a favicon whose bytes churn) while still refreshing
// within a day if the admin swaps their photo.
const ICON_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
} as const

// How tightly to crop the subject (1 = whole photo, >1 zooms in so the face /
// subject fills more of the circle with no padding) and where to centre the
// crop vertically (0 = top, 0.5 = middle — headshots usually sit a bit high).
const PHOTO_ZOOM = 1.4
const PHOTO_FOCUS_Y = 0.28

async function fetchImageBytes(src?: string): Promise<{ buf: Buffer; type: string } | null> {
  if (!src || !/^https?:\/\//i.test(src)) return null
  try {
    const res = await fetch(src, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return null
    const type = res.headers.get('content-type') || ''
    if (!type.startsWith('image/')) return null
    const buf = Buffer.from(await res.arrayBuffer())
    return buf.byteLength ? { buf, type } : null
  } catch {
    return null
  }
}

/**
 * Crop the subject tighter (zoom, removing background padding), resize to the
 * target size and mask to a transparent circle. This is the only reliable way
 * to get BOTH a tight crop and a true round silhouette — Satori clips a circle
 * OR zooms, but never both.
 */
async function roundZoomedPng(input: Buffer, size: number): Promise<Buffer> {
  const meta = await sharp(input).metadata()
  const w = meta.width ?? size
  const h = meta.height ?? size
  const side = Math.min(w, h)
  const crop = Math.max(1, Math.round(side / PHOTO_ZOOM))
  const left = Math.max(0, Math.min(w - crop, Math.round((w - crop) / 2)))
  const top = Math.max(0, Math.min(h - crop, Math.round((h - crop) * PHOTO_FOCUS_Y)))

  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  )

  return sharp(input)
    .extract({ left, top, width: crop, height: crop })
    .resize(size, size, { fit: 'cover' })
    // dest-in keeps the photo only where the white circle is opaque → round,
    // transparent corners.
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()
}

/**
 * Shared renderer for the site favicon / app icons (`app/icon.tsx`,
 * `app/apple-icon.tsx`). Produces a tightly-cropped, full-bleed ROUND PNG of the
 * OWNER'S PHOTO so it shows as the favicon next to Google results and in browser
 * tabs / PWA installs — no white square, no padding, subject as large as
 * possible.
 *
 * The photo is the admin-configured Hero image. If sharp can't process it the
 * code falls back to a Satori circular avatar, and if no usable photo exists
 * (fresh clone, unreachable image, transient DB error) to a branded round
 * monogram — so the favicon NEVER hard fails and carries zero hardcoded data.
 */
export async function buildIconResponse(dimension: number): Promise<Response> {
  // Tolerate a transient DB error: fall through to the monogram rather than 500.
  let hero: { imageUrl?: string; name?: string; lastName?: string } | null = null
  try {
    hero = await getSiteContent('hero')
  } catch {
    /* DB unreachable — render the monogram fallback below */
  }

  const img = hero?.imageUrl ? await fetchImageBytes(hero.imageUrl) : null

  if (img) {
    try {
      const png = await roundZoomedPng(img.buf, dimension)
      return new Response(new Uint8Array(png), {
        headers: { 'Content-Type': 'image/png', ...ICON_CACHE_HEADERS },
      })
    } catch {
      // sharp failed — fall back to a Satori circular avatar (natural framing).
      const dataUri = `data:${img.type};base64,${img.buf.toString('base64')}`
      return new ImageResponse(
        (
          <img
            src={dataUri}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          />
        ),
        { width: dimension, height: dimension, headers: ICON_CACHE_HEADERS },
      )
    }
  }

  // Fallback: a branded round monogram from the resolved identity (never
  // hardcoded, and resilient if the identity itself can't be loaded).
  let siteName = ''
  try {
    siteName = (await getSeo()).siteName
  } catch {
    /* ignore — initials fall back to 'P' */
  }
  const initials =
    `${hero?.name?.trim()?.[0] ?? ''}${hero?.lastName?.trim()?.[0] ?? ''}`.toUpperCase() ||
    siteName.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() ||
    'P'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0d0d0f 0%, #1a1a2e 100%)',
          color: '#a855f7',
          fontSize: dimension * 0.5,
          fontWeight: 700,
          letterSpacing: dimension * 0.01,
          fontFamily: 'sans-serif',
        }}
      >
        {initials}
      </div>
    ),
    { width: dimension, height: dimension, headers: ICON_CACHE_HEADERS },
  )
}
