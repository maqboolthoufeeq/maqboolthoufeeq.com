import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'
import { getRequestOrigin } from '@/lib/request-origin'
import { getSeo, getSiteContent } from '@/lib/site-content'
import { buildPageMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const [origin, seo, legal] = await Promise.all([
    getRequestOrigin(),
    getSeo(),
    getSiteContent('legal'),
  ])
  return buildPageMetadata({
    origin,
    title: `${legal.privacyTitle} — ${seo.siteName}`,
    description: `Privacy policy for ${seo.siteName}.`,
    path: '/privacy',
    ogTitle: legal.privacyTitle,
    siteName: seo.siteName,
  })
}

export default async function PrivacyPage() {
  const legal = await getSiteContent('legal')
  return <LegalPage title={legal.privacyTitle} body={legal.privacyBody} updated={legal.updated} />
}
