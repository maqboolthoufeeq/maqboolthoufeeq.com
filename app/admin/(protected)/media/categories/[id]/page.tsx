import { notFound } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import MediaTopicItems from '@/components/admin/MediaTopicItems'
import { type MediaListItem } from '@/components/admin/MediaItemCard'
import { prisma } from '@/lib/prisma'
import type { Platform } from '@/lib/social'

type Props = { params: Promise<{ id: string }> }

export default async function AdminTopicDetailPage({ params }: Props) {
  const { id } = await params
  const category = await prisma.mediaCategory.findUnique({ where: { id } })
  if (!category) notFound()

  const rows = await prisma.mediaItem.findMany({
    where: { categoryId: id },
    orderBy: { order: 'asc' },
    select: {
      id: true, platform: true, title: true, embedId: true, sourceUrl: true,
      thumbnailUrl: true, featured: true, published: true, order: true, categoryId: true,
    },
  })
  const items: MediaListItem[] = rows.map((r) => ({
    ...r,
    platform: r.platform as Platform,
    categoryName: category.name,
  }))

  return (
    <AdminShell title={category.name} back="/admin/media/categories">
      <div className="max-w-3xl mx-auto">
        <p className="text-sm text-[var(--muted)] mb-4">
          {items.length} item{items.length !== 1 ? 's' : ''} in <span className="text-[var(--foreground)] font-medium">{category.name}</span>.
          These appear as the “{category.name}” row on your Reels and Videos pages.
        </p>
        <MediaTopicItems categoryId={id} initialItems={items} />
      </div>
    </AdminShell>
  )
}
