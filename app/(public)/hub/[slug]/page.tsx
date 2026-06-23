import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import HubTopicView from '@/components/hub/HubTopicView'
import HubAdminProvider from '@/components/hub/hub-admin'
import { getHubTopicDetail, getHubCategories, getHubTopicOptions } from '@/lib/hub'
import { getRequestOrigin } from '@/lib/request-origin'
import { getSeo } from '@/lib/site-content'
import { buildPageMetadata } from '@/lib/seo'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ slug }, origin, seo] = await Promise.all([params, getRequestOrigin(), getSeo()])
  const topic = await getHubTopicDetail(slug)
  if (!topic) {
    return buildPageMetadata({ origin, title: `Not found — ${seo.siteName}`, description: 'Page not found.', path: `/hub/${slug}` })
  }
  const description = topic.description?.trim() || `${topic.title} — curated links and resources by ${seo.siteName}.`
  return buildPageMetadata({
    origin,
    title: `${topic.title} — ${seo.siteName}`,
    description,
    path: `/hub/${slug}`,
    ogTitle: topic.title,
    image: topic.coverImage ?? undefined,
    siteName: seo.siteName,
  })
}

export default async function HubTopicPage({ params }: Props) {
  const { slug } = await params
  const [topic, session, categories, topicOptions] = await Promise.all([
    getHubTopicDetail(slug),
    auth(),
    getHubCategories(),
    getHubTopicOptions(),
  ])
  if (!topic) notFound()
  const isAdmin = !!session

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <HubAdminProvider isAdmin={isAdmin} categories={categories} topicOptions={topicOptions}>
          <HubTopicView topic={topic} />
        </HubAdminProvider>
      </main>
    </>
  )
}
