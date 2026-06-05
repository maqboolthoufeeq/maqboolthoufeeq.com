import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Plus } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { auth } from '@/lib/auth'
import { getTopicMedia } from '@/lib/media'
import type { Platform } from '@/lib/social'
import MediaGrid from '@/components/social/MediaGrid'
import { InstagramIcon, YoutubeIcon } from '@/components/social/icons'

/**
 * A single topic's full gallery for one platform — the page reached from the
 * "View all" link on a topic row of /reels or /videos.
 */
export default async function MediaTopicPage({ platform, slug }: { platform: Platform; slug: string }) {
  const [data, session] = await Promise.all([getTopicMedia(platform, slug), auth()])
  if (!data) notFound()

  const isReel = platform === 'instagram'
  const base = isReel ? '/reels' : '/videos'
  const noun = isReel ? 'reel' : 'video'
  const isAdmin = !!session
  const n = data.items.length

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <Link href={base} className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-4">
          <ArrowLeft size={16} /> All {isReel ? 'reels' : 'videos'}
        </Link>

        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {isReel ? <InstagramIcon size={24} className="text-[var(--accent)] shrink-0" /> : <YoutubeIcon size={24} className="text-[var(--accent)] shrink-0" />}
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] truncate">{data.category.name}</h1>
          </div>
          {isAdmin && (
            <Link
              href={`/admin/media/new?platform=${platform}&category=${data.category.id}&from=${encodeURIComponent(`${base}/${data.category.slug}`)}`}
              className="tap-scale shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90"
            >
              <Plus size={18} strokeWidth={2.4} />
              <span className="hidden sm:inline">Add</span>
            </Link>
          )}
        </div>
        <p className="text-sm text-[var(--muted)] mb-1">
          {n} {noun}{n !== 1 ? 's' : ''} in this topic
        </p>
        <div className="w-10 h-0.5 bg-[var(--accent)] mb-10" />

        {n === 0 ? (
          <p className="text-[var(--muted)]">Nothing in this topic yet. Check back soon.</p>
        ) : (
          <Suspense fallback={null}>
            <MediaGrid items={data.items} />
          </Suspense>
        )}
      </main>
    </>
  )
}
