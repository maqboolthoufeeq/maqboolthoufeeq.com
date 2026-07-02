'use client'

import { useEffect, useState } from 'react'
import { Grid2x2, Grid3x3, List } from 'lucide-react'
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
  const [view, setView] = useState<'list' | 'grid2' | 'grid3'>('list')

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
          {([
            { key: 'list', label: 'List view', Icon: List },
            { key: 'grid2', label: '2-column grid', Icon: Grid2x2 },
            { key: 'grid3', label: '3-column grid', Icon: Grid3x3 },
          ] as const).map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              title={label}
              aria-label={label}
              aria-pressed={view === key}
              className={`p-1.5 rounded cursor-pointer transition-colors ${
                view === key
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {view === 'list' ? (
        <ul className="space-y-6">
          {posts.map((post, i) => (
            <li key={post.id}>
              <PostCard post={post} view="list" index={i} isAdmin={isAdmin} />
            </li>
          ))}
        </ul>
      ) : (
        <ul
          className={`grid items-stretch ${
            view === 'grid3' ? 'grid-cols-3 gap-2.5 sm:gap-5' : 'grid-cols-2 gap-4 sm:gap-6'
          }`}
        >
          {posts.map((post, i) => (
            <li key={post.id} className="h-full">
              <PostCard
                post={post}
                view="grid"
                index={i}
                isAdmin={isAdmin}
                excerptMode={view === 'grid2' ? 'short' : 'auto'}
              />
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
