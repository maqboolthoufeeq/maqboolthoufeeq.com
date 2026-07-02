import { Suspense } from 'react'
import { getMediaForLanding } from '@/lib/media'
import { getSiteContent } from '@/lib/site-content'
import MediaShowcase, { type ShowcaseRow } from '@/components/social/MediaShowcase'

/**
 * Landing-page social section: a horizontally scrollable row of Instagram reels
 * and another of YouTube videos, each with a "View all" link through to its
 * dedicated page. The Reels and Videos rows can be toggled independently from
 * Admin → Landing page → Social media. Renders nothing when both are empty/off.
 */
export default async function SocialMedia() {
  const [reels, videos, sections] = await Promise.all([
    getMediaForLanding('instagram', 12),
    getMediaForLanding('youtube', 12),
    getSiteContent('sections'),
  ])

  const socialOff = sections.socialMedia === false
  const reelItems = socialOff || sections.socialReels === false ? [] : reels
  const videoItems = socialOff || sections.socialVideos === false ? [] : videos

  if (reelItems.length === 0 && videoItems.length === 0) return null

  // Empty rows are filtered out by MediaShowcase, so a toggled-off row vanishes.
  const rows: ShowcaseRow[] = [
    { id: 'reels', title: 'Reels', href: '/reels', iconPlatform: 'instagram', items: reelItems },
    { id: 'videos', title: 'Videos', href: '/videos', iconPlatform: 'youtube', items: videoItems },
  ]

  return (
    <section id="social" className="max-w-5xl mx-auto px-4 py-6 sm:py-20">
      <h2 className="text-2xl font-bold text-[var(--foreground)]">Watch</h2>
      <p className="text-sm text-[var(--muted)] mt-1">Reels and videos, playable right here.</p>
      <div className="w-10 h-0.5 bg-[var(--accent)] mt-3 mb-6 sm:mb-10" />

      <Suspense fallback={null}>
        <MediaShowcase rows={rows} />
      </Suspense>
    </section>
  )
}
