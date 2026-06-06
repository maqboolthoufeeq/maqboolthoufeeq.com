import type { Metadata } from 'next'
import { getRequestOrigin } from '@/lib/request-origin'
import { getSeo } from '@/lib/site-content'
import { buildPageMetadata } from '@/lib/seo'
import MediaViewAll from '@/components/social/MediaViewAll'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const [origin, seo] = await Promise.all([getRequestOrigin(), getSeo()])
  return buildPageMetadata({
    origin,
    title: `Reels — ${seo.siteName}`,
    description: `Instagram reels by ${seo.siteName}, sorted by topic and playable right on the page.`,
    path: '/reels',
    ogTitle: 'Reels',
    siteName: seo.siteName,
  })
}

export default function ReelsPage() {
  return (
    <MediaViewAll
      platform="instagram"
      heading="Reels"
      subtitle="Instagram reels — tap any to play, browse by topic below."
    />
  )
}
