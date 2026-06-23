import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import Navbar from '@/components/Navbar'
import HubExplorer from '@/components/hub/HubExplorer'
import HubAdminProvider from '@/components/hub/hub-admin'
import { getHubLanding, getHubCategories, getHubTopicOptions } from '@/lib/hub'
import { getRequestOrigin } from '@/lib/request-origin'
import { getSeo, getSiteContent } from '@/lib/site-content'
import { buildPageMetadata } from '@/lib/seo'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const [origin, seo, hub] = await Promise.all([getRequestOrigin(), getSeo(), getSiteContent('hub')])
  const title = `${hub.title || 'Hub'} — ${seo.siteName}`
  return buildPageMetadata({
    origin,
    title,
    description: hub.subtitle || `Curated topics, links and resources by ${seo.siteName}.`,
    path: '/hub',
    ogTitle: hub.title || 'Hub',
    siteName: seo.siteName,
  })
}

export default async function HubPage() {
  const [data, hub, session, categories, topicOptions] = await Promise.all([
    getHubLanding(),
    getSiteContent('hub'),
    auth(),
    getHubCategories(),
    getHubTopicOptions(),
  ])
  const isAdmin = !!session

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)] mb-3">The Hub</p>
            <h1
              className="text-4xl sm:text-5xl font-bold text-[var(--foreground)] leading-[1.05]"
              style={{ fontFamily: 'var(--font-lora), serif' }}
            >
              {hub.title || 'Hub'}
            </h1>
            {hub.subtitle && <p className="text-[15px] text-[var(--muted)] leading-relaxed mt-3 max-w-xl">{hub.subtitle}</p>}
          </div>
          {isAdmin && (
            <Link
              href="/admin/hub"
              className="tap-scale shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus size={18} strokeWidth={2.4} />
              <span className="hidden sm:inline">Manage</span>
            </Link>
          )}
        </div>

        <HubAdminProvider isAdmin={isAdmin} categories={categories} topicOptions={topicOptions}>
          {data.topics.length === 0 && data.entries.length === 0 && !isAdmin ? (
            <p className="text-[var(--muted)]">Nothing here yet. Check back soon.</p>
          ) : (
            <HubExplorer data={data} />
          )}
        </HubAdminProvider>
      </main>
    </>
  )
}
