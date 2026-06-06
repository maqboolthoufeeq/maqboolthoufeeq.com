import MediaForm from '@/components/admin/MediaForm'
import AdminShell from '@/components/admin/AdminShell'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import type { Platform } from '@/lib/social'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string }> }

/** Only accept in-app relative paths as the return target (no open redirects). */
function safePath(p?: string): string | undefined {
  return p && p.startsWith('/') && !p.startsWith('//') ? p : undefined
}

export default async function EditMediaPage({ params, searchParams }: Props) {
  const { id } = await params
  const { from } = await searchParams
  const item = await prisma.mediaItem.findUnique({ where: { id } })
  if (!item) notFound()

  const initial = {
    platform: item.platform as Platform,
    title: item.title,
    sourceUrl: item.sourceUrl,
    description: item.description ?? '',
    thumbnailUrl: item.thumbnailUrl ?? '',
    previewVideoUrl: item.previewVideoUrl ?? '',
    categoryId: item.categoryId ?? '',
    featured: item.featured,
    published: item.published,
    showDate: item.showDate,
    displayDate: (item.displayDate ?? item.createdAt).toISOString().slice(0, 10),
  }

  return (
    <AdminShell title="Edit" back={safePath(from) ?? '/admin/media'}>
      <div className="max-w-2xl mx-auto">
        <MediaForm mediaId={id} initial={initial} returnTo={safePath(from)} />
      </div>
    </AdminShell>
  )
}
