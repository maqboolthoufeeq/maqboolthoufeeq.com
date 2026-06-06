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
    title: `Videos — ${seo.siteName}`,
    description: `YouTube videos by ${seo.siteName}, sorted by topic and playable right on the page.`,
    path: '/videos',
    ogTitle: 'Videos',
    siteName: seo.siteName,
  })
}

export default function VideosPage() {
  return (
    <MediaViewAll
      platform="youtube"
      heading="Videos"
      subtitle="YouTube videos — tap any to play, browse by topic below."
    />
  )
}
