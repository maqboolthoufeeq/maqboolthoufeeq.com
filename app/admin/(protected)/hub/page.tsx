import Link from 'next/link'
import { FolderOpen } from 'lucide-react'
import AdminShell from '@/components/admin/AdminShell'
import HubTopicList from '@/components/admin/HubTopicList'
import { getHubAdminTree } from '@/lib/hub'

export const dynamic = 'force-dynamic'

export default async function AdminHubPage() {
  const tree = await getHubAdminTree()

  return (
    <AdminShell
      title="Link hub"
      back="/admin"
      action={
        <Link
          href="/admin/hub/categories"
          aria-label="Manage categories"
          className="tap-scale inline-flex items-center justify-center h-10 px-3 sm:px-4 rounded-full border border-[var(--border)] text-[var(--foreground)] text-sm font-medium gap-1.5 hover:border-[var(--accent)]"
        >
          <FolderOpen size={16} />
          <span className="hidden sm:inline">Categories</span>
        </Link>
      }
    >
      <HubTopicList tree={tree} />
    </AdminShell>
  )
}
