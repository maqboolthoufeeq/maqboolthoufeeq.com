'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LayoutGrid, List } from 'lucide-react'
import PostCard from '@/components/blog/PostCard'

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

/**
 * Landing-page "Latest posts" with a list/grid toggle.
 *  • List (default): the 3 most recent posts as full-width rows.
 *  • Grid: up to 6 posts as a horizontally-scrollable carousel of cards.
 *
 * The heading row (title + toggle + "All posts →") lives here so the view
 * toggle can sit inline with the section header rather than on its own line.
 */
export default function BlogPreviewClient({ posts }: { posts: Post[] }) {
  const [view, setView] = useState<'list' | 'grid'>('list')
  const listPosts = posts.slice(0, 3)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-2">
        <h2 className="text-2xl font-bold text-[var(--foreground)]">Latest posts</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] p-1">
            {([
              { key: 'list', label: 'List view', Icon: List },
              { key: 'grid', label: 'Grid view', Icon: LayoutGrid },
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
          <Link href="/blog" className="text-sm text-[var(--accent)] hover:underline whitespace-nowrap">
            All posts →
          </Link>
        </div>
      </div>
      <div className="w-10 h-0.5 bg-[var(--accent)] mb-6 sm:mb-10" />

      {view === 'list' ? (
        <ul className="space-y-6">
          {listPosts.map((post, i) => (
            <li key={post.id}>
              <PostCard post={post} view="list" index={i} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-4 overscroll-x-contain">
          {posts.map((post, i) => (
            <li key={post.id} className="snap-start shrink-0 w-[80%] min-[440px]:w-72 sm:w-80">
              <PostCard post={post} view="grid" index={i} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
