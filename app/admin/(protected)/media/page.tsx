import { Suspense } from 'react'
import Link from 'next/link'
import { FolderOpen } from 'lucide-react'
import MediaList, { type MediaListItem } from '@/components/admin/MediaList'
import AdminShell from '@/components/admin/AdminShell'
import { prisma } from '@/lib/prisma'
import type { Platform } from '@/lib/social'

export default async function AdminMediaPage() {
  const [rows, categories] = await Promise.all([
    prisma.mediaItem.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        platform: true,
        title: true,
        embedId: true,
        sourceUrl: true,
        thumbnailUrl: true,
        featured: true,
        published: true,
        order: true,
        categoryId: true,
        category: { select: { name: true } },
      },
    }),
    prisma.mediaCategory.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }], select: { id: true, name: true } }),
  ])

  const items: MediaListItem[] = rows.map((r) => ({
    id: r.id,
    platform: r.platform as Platform,
    title: r.title,
    embedId: r.embedId,
    sourceUrl: r.sourceUrl,
    thumbnailUrl: r.thumbnailUrl,
    featured: r.featured,
    published: r.published,
    order: r.order,
    categoryId: r.categoryId,
    categoryName: r.category?.name ?? null,
  }))

  return (
    <AdminShell
      title="Social media"
      back="/admin"
      action={
        <Link
          href="/admin/media/categories"
          aria-label="Manage topics"
          className="tap-scale inline-flex items-center justify-center h-10 px-3 sm:px-4 rounded-full border border-[var(--border)] text-[var(--foreground)] text-sm font-medium gap-1.5 hover:border-[var(--accent)]"
        >
          <FolderOpen size={16} />
          <span className="hidden sm:inline">Topics</span>
        </Link>
      }
    >
      <Suspense fallback={null}>
        <MediaList initialItems={items} categories={categories} />
      </Suspense>
    </AdminShell>
  )
}
