export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getRequestOrigin } from '@/lib/request-origin'
import { buildPageMetadata } from '@/lib/seo'
import { getActiveTemplateId } from '@/lib/templates'
import { getSeo, getSiteContent } from '@/lib/site-content'
import { absoluteUrl } from '@/lib/utils'
import { profilePageNode } from '@/lib/structured-data'
import { JsonLd } from '@/components/JsonLd'
import { auth } from '@/lib/auth'
import AdminFab from '@/components/admin/AdminFab'
import ClassicTemplate from '@/components/templates/ClassicTemplate'
import CenteredTemplate from '@/components/templates/CenteredTemplate'
import SidebarTemplate from '@/components/templates/SidebarTemplate'
import BentoTemplate from '@/components/templates/BentoTemplate'
import TerminalTemplate from '@/components/templates/TerminalTemplate'
import MagazineTemplate from '@/components/templates/MagazineTemplate'

export async function generateMetadata(): Promise<Metadata> {
  const [origin, seo] = await Promise.all([getRequestOrigin(), getSeo()])
  return buildPageMetadata({
    origin,
    title: `${seo.siteName} — ${seo.role}`,
    description: seo.tagline,
    path: '/',
    ogTitle: seo.siteName,
    siteName: seo.siteName,
  })
}

function Template({ templateId }: { templateId: string }) {
  switch (templateId) {
    case 'centered':
      return <CenteredTemplate />
    case 'sidebar':
      return <SidebarTemplate />
    case 'bento':
      return <BentoTemplate />
    case 'terminal':
      return <TerminalTemplate />
    case 'magazine':
      return <MagazineTemplate />
    default:
      return <ClassicTemplate />
  }
}

export default async function Home() {
  const [templateId, session, origin, seo, hero] = await Promise.all([
    getActiveTemplateId(),
    auth(),
    getRequestOrigin(),
    getSeo(),
    getSiteContent('hero'),
  ])
  const isAdmin = !!session

  const profile = profilePageNode({
    origin,
    seo,
    imageUrl: hero.imageUrl ? absoluteUrl(hero.imageUrl, origin) : undefined,
  })

  return (
    <>
      <JsonLd data={profile} />
      <Template templateId={templateId} />
      {isAdmin && <AdminFab />}
    </>
  )
}
