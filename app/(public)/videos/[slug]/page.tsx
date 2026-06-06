import type { Metadata } from 'next'
import { getRequestOrigin } from '@/lib/request-origin'
import { getSeo } from '@/lib/site-content'
import { buildPageMetadata } from '@/lib/seo'
import { prisma } from '@/lib/prisma'
import MediaTopicPage from '@/components/social/MediaTopicPage'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ slug }, origin, seo] = await Promise.all([params, getRequestOrigin(), getSeo()])
  const cat = await prisma.mediaCategory.findUnique({ where: { slug } })
  const name = cat?.name ?? 'Videos'
  return buildPageMetadata({
    origin,
    title: `${name} videos — ${seo.siteName}`,
    description: `${name} videos by ${seo.siteName}.`,
    path: `/videos/${slug}`,
    ogTitle: `${name} videos`,
    siteName: seo.siteName,
  })
}

export default async function VideosTopicPage({ params }: Props) {
  const { slug } = await params
  return <MediaTopicPage platform="youtube" slug={slug} />
}
