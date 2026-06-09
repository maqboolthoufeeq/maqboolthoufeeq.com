import { notFound } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import HubTopicForm from '@/components/admin/HubTopicForm'
import { getHubCategories, getHubTopicForEdit, getHubTopicOptions } from '@/lib/hub'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function EditHubTopicPage({ params }: Props) {
  const { id } = await params
  const [initial, topicOptions, categories] = await Promise.all([
    getHubTopicForEdit(id),
    getHubTopicOptions(),
    getHubCategories(),
  ])
  if (!initial) notFound()

  // Exclude the topic itself and its descendants from the parent picker to
  // prevent cycles (the API enforces this too).
  const descendantIds = new Set<string>([initial.id])
  let grew = true
  while (grew) {
    grew = false
    for (const t of topicOptions) {
      if (t.parentId && descendantIds.has(t.parentId) && !descendantIds.has(t.id)) {
        descendantIds.add(t.id)
        grew = true
      }
    }
  }
  const parentOptions = topicOptions.filter((t) => !descendantIds.has(t.id))

  return (
    <AdminShell title="Edit topic" back="/admin/hub">
      <HubTopicForm initial={initial} topicOptions={parentOptions} categories={categories} />
    </AdminShell>
  )
}
