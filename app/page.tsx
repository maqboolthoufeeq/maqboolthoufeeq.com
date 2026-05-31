export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getRequestOrigin } from '@/lib/request-origin'
import { buildPageMetadata } from '@/lib/seo'
import { getActiveTemplateId } from '@/lib/templates'
import { getSeo } from '@/lib/site-content'
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
  const [templateId, session] = await Promise.all([getActiveTemplateId(), auth()])
  const isAdmin = !!session

  return (
    <>
      <Template templateId={templateId} />
      {isAdmin && <AdminFab />}
    </>
  )
}
