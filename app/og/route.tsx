import { ImageResponse } from 'next/og'
import { BrandedOgCard, OG_CACHE_HEADERS, OG_SIZE } from '@/lib/og-card'
import { getSeo } from '@/lib/site-content'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_TITLE = 120
const MAX_SUBTITLE = 200

/**
 * Site-wide default Open Graph card (1200x630). Pages without a featured image
 * (home, /blog, /projects, and any future page) point their og:image here.
 * Accepts optional `?title=` and `?subtitle=` so each page gets a tailored
 * heading; falls back to the resolved site identity when omitted.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const seo = await getSeo()
  const title = (searchParams.get('title')?.trim() || seo.siteName).slice(0, MAX_TITLE)
  const subtitle = (searchParams.get('subtitle')?.trim() || seo.tagline).slice(0, MAX_SUBTITLE)

  return new ImageResponse(
    <BrandedOgCard title={title} subtitle={subtitle} domain={seo.domain} author={seo.author} role={seo.role} />,
    {
      ...OG_SIZE,
      headers: OG_CACHE_HEADERS,
    },
  )
}
