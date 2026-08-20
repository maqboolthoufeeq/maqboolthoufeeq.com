import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AdminShell from '@/components/admin/AdminShell'
import IntegrationsPanel from '@/components/admin/IntegrationsPanel'
import { listIntegrationsForAdmin } from '@/lib/integrations/store'
import { listProviderMeta } from '@/lib/integrations/registry'
import { isEncryptionConfigured } from '@/lib/integrations/crypto'

export const dynamic = 'force-dynamic'

export default async function IntegrationsPage() {
  const [integrations, providerMeta] = await Promise.all([
    listIntegrationsForAdmin(),
    Promise.resolve(listProviderMeta()),
  ])

  return (
    <AdminShell
      title="Integrations"
      back="/admin"
      action={
        <Link
          href="/admin"
          className="hidden sm:inline-flex items-center gap-1.5 h-10 px-3 rounded-full text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]"
        >
          <ArrowLeft size={16} /> Dashboard
        </Link>
      }
    >
      <IntegrationsPanel
        initial={integrations}
        providerMeta={providerMeta}
        encryptionConfigured={isEncryptionConfigured()}
      />
    </AdminShell>
  )
}
