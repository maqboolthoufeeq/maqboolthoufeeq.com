export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getRequestOrigin } from '@/lib/request-origin'
import { SITE_NAME, SITE_TAGLINE, buildPageMetadata } from '@/lib/seo'
import { getActiveTemplateId } from '@/lib/templates'
import { auth } from '@/lib/auth'
import AdminFab from '@/components/admin/AdminFab'
import ClassicTemplate from '@/components/templates/ClassicTemplate'
import CenteredTemplate from '@/components/templates/CenteredTemplate'
import SidebarTemplate from '@/components/templates/SidebarTemplate'
import BentoTemplate from '@/components/templates/BentoTemplate'
import TerminalTemplate from '@/components/templates/TerminalTemplate'
import MagazineTemplate from '@/components/templates/MagazineTemplate'

export async function generateMetadata(): Promise<Metadata> {
  const origin = await getRequestOrigin()
  return buildPageMetadata({
    origin,
    title: `${SITE_NAME} — Full-Stack Developer`,
    description: SITE_TAGLINE,
    path: '/',
    ogTitle: SITE_NAME,
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
