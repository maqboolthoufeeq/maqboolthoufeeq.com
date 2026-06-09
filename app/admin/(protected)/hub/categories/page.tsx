import AdminShell from '@/components/admin/AdminShell'
import HubCategoryManager from '@/components/admin/HubCategoryManager'
import { getHubCategories } from '@/lib/hub'

export const dynamic = 'force-dynamic'

export default async function HubCategoriesPage() {
  const categories = await getHubCategories()

  return (
    <AdminShell title="Hub categories" back="/admin/hub">
      <HubCategoryManager initial={categories} />
    </AdminShell>
  )
}
