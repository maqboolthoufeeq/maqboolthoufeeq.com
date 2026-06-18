import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'
import AnnouncementHistory from '@/components/AnnouncementHistory'
import { getRequestOrigin } from '@/lib/request-origin'
import { getSeo } from '@/lib/site-content'
import { buildPageMetadata } from '@/lib/seo'
import { getBanners } from '@/lib/banners'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const [origin, seo] = await Promise.all([getRequestOrigin(), getSeo()])
  return buildPageMetadata({
    origin,
    title: `Announcements — ${seo.siteName}`,
    description: `The latest news, notices and announcements from ${seo.siteName}.`,
    path: '/announcements',
    ogTitle: 'Announcements',
    siteName: seo.siteName,
  })
}

export default async function AnnouncementsPage() {
  const banners = await getBanners()

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16 min-h-[60vh]">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Announcements</h1>
        <p className="text-[var(--muted)] mt-2 mb-3">
          The latest news, updates and notices — newest first.
        </p>
        <div className="w-10 h-0.5 bg-[var(--accent)] mb-10" />
        <AnnouncementHistory banners={banners} />
      </main>
      <SiteFooter />
    </>
  )
}
