import AdminShell from '@/components/admin/AdminShell'
import HubTopicForm from '@/components/admin/HubTopicForm'
import { getHubCategories, getHubTopicOptions } from '@/lib/hub'

export const dynamic = 'force-dynamic'

export default async function NewHubTopicPage() {
  const [topicOptions, categories] = await Promise.all([getHubTopicOptions(), getHubCategories()])

  return (
    <AdminShell title="New topic" back="/admin/hub">
      <HubTopicForm initial={null} topicOptions={topicOptions} categories={categories} />
    </AdminShell>
  )
}
