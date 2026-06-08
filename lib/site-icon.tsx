import { ImageResponse } from 'next/og'
import { getSiteContent, getSeo } from '@/lib/site-content'
import { fetchImageAsDataUri } from '@/lib/og-card'

// Let Google / the CDN / browsers cache the favicon so the URL stays stable
// (Google won't display a favicon whose bytes churn) while still refreshing
// within a day if the admin swaps their photo.
const ICON_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
} as const

/**
 * Shared renderer for the site favicon / app icons (`app/icon.tsx`,
 * `app/apple-icon.tsx`). Produces a square PNG so the OWNER'S PHOTO shows as the
 * favicon next to Google search results and in browser tabs / PWA installs.
 *
 * The photo is the admin-configured Hero image, fetched and inlined as a data
 * URI (same proven path as the `/og` share card). When no usable photo exists
 * (fresh clone, unreachable image, or a transient DB error) it falls back to a
 * branded monogram built from the site identity — so the favicon NEVER hard
 * fails (a 500 here would leave Google/browsers with no icon) and there is zero
 * hardcoded personal data.
 *
 * Google's favicon guidance: a square icon, a multiple of 48px, served from a
 * stable crawlable URL with `rel="icon"` (Next injects that automatically from
 * these file conventions). 256px+ renders crisply in tabs and scales cleanly to
 * the 16/32/48px Google displays.
 */
export async function buildIconResponse(dimension: number): Promise<ImageResponse> {
  // Tolerate a transient DB error: fall through to the monogram rather than 500.
  let hero: { imageUrl?: string; name?: string; lastName?: string } | null = null
  try {
    hero = await getSiteContent('hero')
  } catch {
    /* DB unreachable — render the monogram fallback below */
  }

  const photo = hero?.imageUrl ? await fetchImageAsDataUri(hero.imageUrl) : null

  if (photo) {
    return new ImageResponse(
      (
        // Satori needs a raw <img>; full-bleed cover keeps the face centered.
        <img
          src={photo}
          width={dimension}
          height={dimension}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ),
      { width: dimension, height: dimension, headers: ICON_CACHE_HEADERS },
    )
  }

  // Fallback: a branded monogram from the resolved identity (never hardcoded,
  // and resilient if the identity itself can't be loaded).
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
