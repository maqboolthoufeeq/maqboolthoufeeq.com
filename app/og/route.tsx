import { ImageResponse } from 'next/og'
import { BrandedOgCard, OG_CACHE_HEADERS, OG_SIZE } from '@/lib/og-card'
import { SITE_NAME, SITE_TAGLINE } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_TITLE = 120
const MAX_SUBTITLE = 200

/**
 * Site-wide default Open Graph card (1200x630). Pages without a featured image
 * (home, /blog, /projects, and any future page) point their og:image here.
 * Accepts optional `?title=` and `?subtitle=` so each page gets a tailored
 * heading; falls back to the site brand when omitted.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const title = (searchParams.get('title')?.trim() || SITE_NAME).slice(0, MAX_TITLE)
  const subtitle = (searchParams.get('subtitle')?.trim() || SITE_TAGLINE).slice(0, MAX_SUBTITLE)

  return new ImageResponse(<BrandedOgCard title={title} subtitle={subtitle} />, {
    ...OG_SIZE,
    headers: OG_CACHE_HEADERS,
  })
}
