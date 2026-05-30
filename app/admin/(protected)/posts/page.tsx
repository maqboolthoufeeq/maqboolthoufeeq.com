import Link from 'next/link'
import { Plus } from 'lucide-react'
import PostTable from '@/components/admin/PostTable'
import AdminShell from '@/components/admin/AdminShell'
import { prisma } from '@/lib/prisma'

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, slug: true, published: true,
      publishedAt: true, createdAt: true, views: true, zaps: true,
    },
  })

  return (
    <AdminShell
      title="Posts"
      back="/admin"
      active="posts"
      action={
        <Link
          href="/admin/posts/new"
          aria-label="New post"
          className="tap-scale inline-flex items-center justify-center h-10 sm:h-10 px-3 sm:px-4 rounded-full bg-[var(--accent)] text-white text-sm font-medium gap-1.5 hover:opacity-90"
        >
          <Plus size={18} strokeWidth={2.4} />
          <span className="hidden sm:inline">New post</span>
        </Link>
      }
    >
      <PostTable posts={posts} />
    </AdminShell>
  )
}
