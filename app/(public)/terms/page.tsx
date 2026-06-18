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
    title: `${legal.termsTitle} — ${seo.siteName}`,
    description: `Terms and conditions for ${seo.siteName}.`,
    path: '/terms',
    ogTitle: legal.termsTitle,
    siteName: seo.siteName,
  })
}

export default async function TermsPage() {
  const legal = await getSiteContent('legal')
  return <LegalPage title={legal.termsTitle} body={legal.termsBody} updated={legal.updated} />
}
