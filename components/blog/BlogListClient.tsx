'use client'

import { useEffect, useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import PostCard from './PostCard'
import { fetchMorePosts } from '@/app/(public)/blog/actions'

type Tag = { id: string; name: string; slug: string }
type Post = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  publishedAt: Date | string | null
  coverImage: string | null
  tags: Tag[]
}

const PAGE_SIZE = 6

export default function BlogListClient({
  initialPosts,
  initialHasMore,
  q,
  tag,
  isAdmin = false,
}: {
  initialPosts: Post[]
  initialHasMore: boolean
  q: string
  tag: string
  isAdmin?: boolean
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('list')

  // When the search/tag filter changes, the server re-renders and passes a new
  // set of posts. Adopt them so the list reflects the active filter without a
  // full page reload (soft navigation).
  useEffect(() => {
    setPosts(initialPosts)
    setHasMore(initialHasMore)
  }, [initialPosts, initialHasMore])

  async function loadMore() {
    setLoading(true)
    const more = await fetchMorePosts(posts.length, q, tag)
    setPosts((prev) => [...prev, ...(more as Post[])])
    setHasMore(more.length === PAGE_SIZE)
    setLoading(false)
  }

  if (initialPosts.length === 0) {
    return (
      <p className="text-[var(--muted)]">
        {q || tag ? 'No posts match your search.' : 'No posts yet. Check back soon.'}
      </p>
    )
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] p-1">
          <button
            type="button"
            onClick={() => setView('list')}
            title="List view"
            className={`p-1.5 rounded cursor-pointer transition-colors ${
              view === 'list'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => setView('grid')}
            title="Grid view"
            className={`p-1.5 rounded cursor-pointer transition-colors ${
              view === 'grid'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <ul className="grid sm:grid-cols-2 gap-6 items-stretch">
          {posts.map((post, i) => (
            <li key={post.id} className="h-full">
              <PostCard post={post} view="grid" index={i} isAdmin={isAdmin} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-6">
          {posts.map((post, i) => (
            <li key={post.id}>
              <PostCard post={post} view="list" index={i} isAdmin={isAdmin} />
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <div className="flex justify-center mt-10">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}
