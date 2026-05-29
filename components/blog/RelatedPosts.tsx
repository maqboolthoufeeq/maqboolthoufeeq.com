import PostCard from '@/components/blog/PostCard'
import type { RelatedPost } from '@/lib/related-posts'

export default function RelatedPosts({
  posts,
  isAdmin = false,
}: {
  posts: RelatedPost[]
  isAdmin?: boolean
}) {
  if (posts.length === 0) return null

  return (
    <section className="mt-16 pt-10 border-t border-[var(--border)]">
      <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Read similar blogs</h2>
      <div className="w-10 h-0.5 bg-[var(--accent)] mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} view="grid" isAdmin={isAdmin} />
        ))}
      </div>
    </section>
  )
}
