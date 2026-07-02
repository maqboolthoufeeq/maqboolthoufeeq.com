'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronRight, LayoutGrid, List } from 'lucide-react'
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
 *  • Grid: up to 6 posts as a horizontally-scrollable carousel — with a right
 *    scroll arrow (only while there's more to reveal) and a "Show more" tile at
 *    the end that links through to the full blog.
 */
export default function BlogPreviewClient({ posts }: { posts: Post[] }) {
  const [view, setView] = useState<'list' | 'grid'>('list')
  const listPosts = posts.slice(0, 3)
  const userChose = useRef(false)

  // Default to the horizontal-scroll grid on phones; desktop keeps the list.
  // Runs once after mount (SSR renders 'list', so no hydration mismatch), and
  // bails out if the visitor has already picked a view themselves.
  useEffect(() => {
    if (userChose.current) return
    if (window.matchMedia('(max-width: 639px)').matches) setView('grid')
  }, [])

  const chooseView = (v: 'list' | 'grid') => {
    userChose.current = true
    setView(v)
  }

  const scrollerRef = useRef<HTMLUListElement>(null)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScroll = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }, [])

  useEffect(() => {
    if (view !== 'grid') return
    updateScroll()
    const el = scrollerRef.current
    el?.addEventListener('scroll', updateScroll, { passive: true })
    window.addEventListener('resize', updateScroll)
    return () => {
      el?.removeEventListener('scroll', updateScroll)
      window.removeEventListener('resize', updateScroll)
    }
  }, [view, updateScroll])

  const scrollByCards = () => {
    const el = scrollerRef.current
    if (el) el.scrollBy({ left: el.clientWidth * 0.8, behavior: 'smooth' })
  }

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
                onClick={() => chooseView(key)}
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
        <div className="relative">
          <ul
            ref={scrollerRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-4 overscroll-x-contain"
          >
            {posts.map((post, i) => (
              <li key={post.id} className="snap-start shrink-0 w-[80%] min-[440px]:w-72 sm:w-80">
                <PostCard post={post} view="grid" index={i} />
              </li>
            ))}

            {/* "Show more" tile at the end of the row → the full blog. */}
            <li className="snap-start shrink-0 w-[55%] min-[440px]:w-44 sm:w-48 flex">
              <Link
                href="/blog"
                className="tap-scale group flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] group-hover:border-[var(--accent)] transition-colors">
                  <ArrowRight size={20} />
                </span>
                <span className="text-sm font-medium">Show more</span>
              </Link>
            </li>
          </ul>

          {/* Small scroll arrow — only while more posts remain to the right. */}
          {canScrollRight && (
            <button
              type="button"
              onClick={scrollByCards}
              aria-label="Scroll for more posts"
              className="tap-scale absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]/90 text-[var(--foreground)] shadow-lg backdrop-blur-sm transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
