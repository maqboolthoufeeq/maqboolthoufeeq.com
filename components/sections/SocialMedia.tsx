import { Suspense } from 'react'
import { getMediaForLanding } from '@/lib/media'
import MediaShowcase, { type ShowcaseRow } from '@/components/social/MediaShowcase'

/**
 * Landing-page social section: a horizontally scrollable row of Instagram reels
 * and another of YouTube videos, each with a "View all" link through to its
 * dedicated page. Renders nothing until there's something to show.
 */
export default async function SocialMedia() {
  const [reels, videos] = await Promise.all([
    getMediaForLanding('instagram', 12),
    getMediaForLanding('youtube', 12),
  ])

  if (reels.length === 0 && videos.length === 0) return null

  const rows: ShowcaseRow[] = [
    { id: 'reels', title: 'Reels', href: '/reels', iconPlatform: 'instagram', items: reels },
    { id: 'videos', title: 'Videos', href: '/videos', iconPlatform: 'youtube', items: videos },
  ]

  return (
    <section id="social" className="max-w-5xl mx-auto px-4 py-20">
      <h2 className="text-2xl font-bold text-[var(--foreground)]">Watch</h2>
      <p className="text-sm text-[var(--muted)] mt-1">Reels and videos, playable right here.</p>
      <div className="w-10 h-0.5 bg-[var(--accent)] mt-3 mb-10" />

      <Suspense fallback={null}>
        <MediaShowcase rows={rows} allItems={[...reels, ...videos]} />
      </Suspense>
    </section>
  )
}
