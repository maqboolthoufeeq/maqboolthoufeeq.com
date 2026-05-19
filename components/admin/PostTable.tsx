'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Post = {
  id: string
  title: string
  slug: string
  published: boolean
  publishedAt: Date | null
  createdAt: Date
}

export default function PostTable({ posts }: { posts: Post[] }) {
  const router = useRouter()

  async function handleDelete(id: string) {
    if (!confirm('Delete this post?')) return
    await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (posts.length === 0) {
    return <p className="text-[var(--muted)]">No posts yet. <Link href="/admin/posts/new" className="text-[var(--accent)] hover:underline">Create one →</Link></p>
  }

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
            <th className="text-left px-4 py-3 text-[var(--muted)] font-medium">Title</th>
            <th className="text-left px-4 py-3 text-[var(--muted)] font-medium hidden sm:table-cell">Status</th>
            <th className="text-left px-4 py-3 text-[var(--muted)] font-medium hidden md:table-cell">Date</th>
            <th className="text-right px-4 py-3 text-[var(--muted)] font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)] transition-colors">
              <td className="px-4 py-3 text-[var(--foreground)]">{post.title}</td>
              <td className="px-4 py-3 hidden sm:table-cell">
                <span className={`text-xs px-2 py-0.5 rounded-full ${post.published ? 'bg-green-500/10 text-green-400' : 'bg-[var(--border)] text-[var(--muted)]'}`}>
                  {post.published ? 'Published' : 'Draft'}
                </span>
              </td>
              <td className="px-4 py-3 text-[var(--muted)] hidden md:table-cell">
                {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex gap-3 justify-end">
                  <Link href={`/admin/posts/${post.id}/edit`} className="text-[var(--accent)] hover:underline">Edit</Link>
                  <button onClick={() => handleDelete(post.id)} className="text-red-400 hover:underline">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
