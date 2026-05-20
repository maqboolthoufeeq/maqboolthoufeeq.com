import Link from 'next/link'
import PostTable from '@/components/admin/PostTable'
import { prisma } from '@/lib/prisma'

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, slug: true, published: true, publishedAt: true, createdAt: true },
  })

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">← Dashboard</Link>
          <span className="text-[var(--border)]">/</span>
          <h1 className="font-semibold text-[var(--foreground)]">Posts</h1>
        </div>
        <Link
          href="/admin/posts/new"
          className="px-4 py-1.5 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          New post
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <PostTable posts={posts} />
      </main>
    </div>
  )
}
