'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Pencil, Trash2, FileText, ExternalLink,
  X, SlidersHorizontal, Globe, EyeOff,
  Eye, Zap,
} from 'lucide-react'
import DateRangePicker from '@/components/ui/DateRangePicker'

type Post = {
  id: string
  title: string
  slug: string
  published: boolean
  publishedAt: Date | null
  createdAt: Date
  views: number
  zaps: number
}

export default function PostTable({ posts }: { posts: Post[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showDatePanel, setShowDatePanel] = useState(false)
  const [publishedMap, setPublishedMap] = useState<Record<string, boolean>>(
    () => Object.fromEntries(posts.map((p) => [p.id, p.published]))
  )
  const [toggling, setToggling] = useState<Set<string>>(new Set())

  const q = query.trim().toLowerCase()
  const from = dateFrom ? new Date(dateFrom) : null
  const to = dateTo ? new Date(dateTo + 'T23:59:59') : null

  const filtered = posts.filter((p) => {
    if (q && !p.title.toLowerCase().includes(q) && !p.slug.toLowerCase().includes(q)) return false
    const d = new Date(p.publishedAt ?? p.createdAt)
    if (from && d < from) return false
    if (to && d > to) return false
    return true
  })

  const hasFilters = !!q || !!dateFrom || !!dateTo
  const dateFilterActive = !!dateFrom || !!dateTo

  function clearAll() {
    setQuery('')
    setDateFrom('')
    setDateTo('')
    setShowDatePanel(false)
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return
    await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  async function handleTogglePublish(id: string) {
    const current = publishedMap[id] ?? false
    const next = !current
    setToggling((prev) => new Set(prev).add(id))
    setPublishedMap((prev) => ({ ...prev, [id]: next }))
    await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: next }),
    })
    setToggling((prev) => { const s = new Set(prev); s.delete(id); return s })
  }

  return (
    <div className="space-y-3">

      {/* ── Filter bar ── */}
      <div className="rounded-2xl sm:rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-visible">
        <div className="flex items-center gap-2 p-2">

          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or slug…"
              className="w-full h-9 pl-8 pr-8 text-sm rounded-lg border border-transparent bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted)]/70 focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--surface)] transition-all"
            />
            {q && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Desktop: custom date range picker */}
          <div className="hidden sm:block shrink-0">
            <DateRangePicker
              from={dateFrom}
              to={dateTo}
              onFromChange={setDateFrom}
              onToChange={setDateTo}
            />
          </div>

          {/* Mobile: date filter toggle */}
          <button
            onClick={() => setShowDatePanel((v) => !v)}
            aria-label="Toggle date filter"
            className={`sm:hidden relative w-9 h-9 flex items-center justify-center rounded-lg border transition-all ${showDatePanel || dateFilterActive
              ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
              : 'border-[var(--border)] bg-[var(--background)] text-[var(--muted)]'
              }`}
          >
            <SlidersHorizontal size={14} />
            {dateFilterActive && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[var(--accent)] text-[9px] font-bold text-white flex items-center justify-center">
                1
              </span>
            )}
          </button>

          {/* Clear all */}
          {hasFilters && (
            <button
              onClick={clearAll}
              title="Clear all filters"
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--muted)] hover:text-red-500 hover:border-red-300 transition-all"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Mobile: date range picker panel */}
        {showDatePanel && (
          <div className="sm:hidden px-2 pb-2 border-t border-[var(--border)] pt-2">
            <DateRangePicker
              from={dateFrom}
              to={dateTo}
              onFromChange={setDateFrom}
              onToChange={setDateTo}
              fullWidth
              defaultOpen
            />
          </div>
        )}
      </div>

      {/* Results meta */}
      {hasFilters && (
        <p className="text-[11px] text-[var(--muted)] px-0.5 tabular-nums">
          {filtered.length === 0
            ? 'No posts match'
            : `${filtered.length} of ${posts.length} post${posts.length !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <>
          {/* Legend — what the leading status dots mean */}
          <StatusLegend />

          {/* Mobile cards */}
          <ul className="sm:hidden space-y-2">
            {filtered.map((post) => {
              const isPublished = publishedMap[post.id] ?? post.published
              const isBusy = toggling.has(post.id)
              return (
                <li key={post.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
                  <Link href={`/admin/posts/${post.id}/edit`} className="row-pressable block px-4 pt-4 pb-3">
                    <div className="flex items-start gap-3">
                      <span className={`shrink-0 mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isPublished
                        ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                        : 'bg-[var(--background)] text-[var(--muted)]'
                        }`}>
                        <FileText size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[14px] text-[var(--foreground)] leading-snug line-clamp-2">
                          <StatusDot published={isPublished} className="mr-2 align-middle" />
                          {post.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[11px] text-[var(--muted)]">
                            {formatDate(post.publishedAt ?? post.createdAt)}
                          </span>
                          <StatBadges views={post.views} zaps={post.zaps} />
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="grid grid-cols-4 border-t border-[var(--border)] divide-x divide-[var(--border)]">
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="row-pressable h-11 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-[var(--accent)]"
                    >
                      <Pencil size={12} />
                      Edit
                    </Link>
                    <a
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="row-pressable h-11 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-[var(--muted)]"
                    >
                      <ExternalLink size={12} />
                      View
                    </a>
                    <button
                      onClick={() => handleTogglePublish(post.id)}
                      disabled={isBusy}
                      className={`row-pressable h-11 flex items-center justify-center gap-1 text-[12px] font-semibold disabled:opacity-40 transition-colors ${isPublished ? 'text-orange-500' : 'text-emerald-600'
                        }`}
                    >
                      {isBusy ? (
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      ) : isPublished ? (
                        <><EyeOff size={12} />Unpublish</>
                      ) : (
                        <><Globe size={12} />Publish</>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(post.id, post.title)}
                      className="row-pressable h-11 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-red-400"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>

          {/* Desktop table */}
          <div className="hidden sm:block rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-semibold text-[var(--muted)]">Title</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-semibold text-[var(--muted)]">Date</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-semibold text-[var(--muted)]">Stats</th>
                  <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest font-semibold text-[var(--muted)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((post) => {
                  const isPublished = publishedMap[post.id] ?? post.published
                  const isBusy = toggling.has(post.id)
                  return (
                    <tr key={post.id} className="group hover:bg-[var(--surface)] transition-colors">
                      <td className="px-4 py-4 w-full max-w-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <StatusDot published={isPublished} />
                          <Link
                            href={`/admin/posts/${post.id}/edit`}
                            className="min-w-0 truncate font-semibold text-[13px] text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
                          >
                            {post.title}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[13px] text-[var(--muted)] tabular-nums whitespace-nowrap">
                        {formatDate(post.publishedAt ?? post.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <StatBadges views={post.views} zaps={post.zaps} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-0.5 justify-end whitespace-nowrap">
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View live post"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all"
                          >
                            <ExternalLink size={13} />
                          </a>
                          <button
                            onClick={() => handleTogglePublish(post.id)}
                            disabled={isBusy}
                            title={isPublished ? 'Unpublish post' : 'Publish post'}
                            className={`h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-[12px] font-semibold disabled:opacity-40 transition-all ${isPublished
                              ? 'text-orange-500 hover:bg-orange-500/10'
                              : 'text-emerald-600 hover:bg-emerald-500/10'
                              }`}
                          >
                            {isBusy ? (
                              <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                            ) : isPublished ? (
                              <><EyeOff size={12} />Unpublish</>
                            ) : (
                              <><Globe size={12} />Publish</>
                            )}
                          </button>
                          <Link
                            href={`/admin/posts/${post.id}/edit`}
                            className="h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-[12px] font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all"
                          >
                            <Pencil size={12} />
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(post.id, post.title)}
                            title="Delete post"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Supporting components ─────────────────────────────────────────────────────

function StatBadges({ views, zaps }: { views: number; zaps: number }) {
  return (
    <span className="inline-flex items-center gap-3 text-[12px] text-[var(--muted)] tabular-nums whitespace-nowrap">
      <span className="inline-flex items-center gap-1" title={`${views} views`}>
        <Eye size={13} className="shrink-0" />
        {views.toLocaleString('en-US')}
      </span>
      <span className="inline-flex items-center gap-1" title={`${zaps} zaps`}>
        <Zap size={13} className="shrink-0" />
        {zaps.toLocaleString('en-US')}
      </span>
    </span>
  )
}

function StatusDot({ published, className = '' }: { published: boolean; className?: string }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${published ? 'bg-emerald-500' : 'bg-[var(--muted)]'} ${className}`}
      title={published ? 'Live' : 'Draft'}
      aria-label={published ? 'Live' : 'Draft'}
    />
  )
}

// Explains what the leading status dots mean — shown once above the list.
function StatusLegend() {
  return (
    <div className="flex items-center gap-4 px-1 text-[11px] text-[var(--muted)]">
      <span className="inline-flex items-center gap-1.5"><StatusDot published /> Live</span>
      <span className="inline-flex items-center gap-1.5"><StatusDot published={false} /> Draft</span>
    </div>
  )
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] mb-3">
          <Search size={20} />
        </div>
        <p className="text-[var(--foreground)] font-semibold text-sm">No results</p>
        <p className="text-[var(--muted)] text-xs mt-1">No posts match the current filters.</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] mb-4 shadow-sm">
        <FileText size={24} />
      </div>
      <p className="text-[var(--foreground)] font-semibold">No posts yet</p>
      <p className="text-sm text-[var(--muted)] mt-1 mb-5">Write your first blog post to get started.</p>
      <Link
        href="/admin/posts/new"
        className="tap-scale inline-flex items-center h-10 px-5 rounded-full bg-[var(--accent)] text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
      >
        Create post
      </Link>
    </div>
  )
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
