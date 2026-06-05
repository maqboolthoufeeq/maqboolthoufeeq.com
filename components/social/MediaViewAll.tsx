import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { InstagramIcon, YoutubeIcon } from '@/components/social/icons'
import { auth } from '@/lib/auth'
import { getMediaPageData } from '@/lib/media'
import type { Platform } from '@/lib/social'
import MediaShowcase, { type ShowcaseRow } from '@/components/social/MediaShowcase'

/**
 * Full "view all" page body for one platform: a Featured row on top, then one
 * row per topic (playlist-style), then any uncategorised items. Shared by the
 * /reels and /videos routes.
 */
export default async function MediaViewAll({
  platform,
  heading,
  subtitle,
}: {
  platform: Platform
  heading: string
  subtitle: string
}) {
  const [data, session] = await Promise.all([getMediaPageData(platform), auth()])
  const isAdmin = !!session
  const isReel = platform === 'instagram'
  const base = isReel ? '/reels' : '/videos'

  const rows: ShowcaseRow[] = []
  if (data.featured.length > 0) {
    rows.push({ id: 'featured', title: 'Featured', items: data.featured })
  }
  for (const group of data.groups) {
    // Each topic row links to its own full page.
    rows.push({ id: `cat-${group.id}`, title: group.name, href: `${base}/${group.slug}`, items: group.items })
  }
  if (data.uncategorized.length > 0) {
    rows.push({
      id: 'more',
      title: rows.length > 0 ? 'More' : 'Latest',
      items: data.uncategorized,
    })
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2.5">
            {isReel ? (
              <InstagramIcon size={26} className="text-[var(--accent)]" />
            ) : (
              <YoutubeIcon size={26} className="text-[var(--accent)]" />
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">{heading}</h1>
          </div>
          {isAdmin && (
            <Link
              href={`/admin/media/new?platform=${platform}&from=${encodeURIComponent(base)}`}
              className="tap-scale inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus size={18} strokeWidth={2.4} />
              <span className="hidden sm:inline">Add</span>
            </Link>
          )}
        </div>
        <p className="text-sm text-[var(--muted)] mb-1">{subtitle}</p>
        <div className="w-10 h-0.5 bg-[var(--accent)] mb-10" />

        {data.all.length === 0 ? (
          <p className="text-[var(--muted)]">
            Nothing here yet. Check back soon.
          </p>
        ) : (
          <Suspense fallback={null}>
            <MediaShowcase rows={rows} allItems={data.all} topicNav />
          </Suspense>
        )}
      </main>
    </>
  )
}
