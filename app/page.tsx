export const dynamic = 'force-dynamic'

import { getActiveTemplateId } from '@/lib/templates'
import ClassicTemplate from '@/components/templates/ClassicTemplate'
import CenteredTemplate from '@/components/templates/CenteredTemplate'
import SidebarTemplate from '@/components/templates/SidebarTemplate'
import BentoTemplate from '@/components/templates/BentoTemplate'
import TerminalTemplate from '@/components/templates/TerminalTemplate'
import MagazineTemplate from '@/components/templates/MagazineTemplate'

export default async function Home() {
  const templateId = await getActiveTemplateId()

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
