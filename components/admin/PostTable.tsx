'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Pencil, Trash2, FileText, ExternalLink,
  CalendarRange, X, SlidersHorizontal, Globe, EyeOff,
  ChevronLeft, ChevronRight,
} from 'lucide-react'

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
                          {post.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <StatusPill published={isPublished} />
                          <span className="text-[11px] text-[var(--muted)]">
                            {formatDate(post.publishedAt ?? post.createdAt)}
                          </span>
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
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest font-semibold text-[var(--muted)]">Title</th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest font-semibold text-[var(--muted)]">Status</th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest font-semibold text-[var(--muted)]">Date</th>
                  <th className="text-right px-5 py-3 text-[10px] uppercase tracking-widest font-semibold text-[var(--muted)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((post) => {
                  const isPublished = publishedMap[post.id] ?? post.published
                  const isBusy = toggling.has(post.id)
                  return (
                    <tr key={post.id} className="group hover:bg-[var(--surface)] transition-colors">
                      <td className="px-5 py-4 min-w-0">
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          className="block font-semibold text-[13px] text-[var(--foreground)] hover:text-[var(--accent)] transition-colors truncate max-w-[380px]"
                        >
                          {post.title}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill published={isPublished} />
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[var(--muted)] tabular-nums whitespace-nowrap">
                        {formatDate(post.publishedAt ?? post.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-0.5 justify-end">
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View live post"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all opacity-0 group-hover:opacity-100"
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
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
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

// ─── Custom Date Range Picker ──────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseLocal(ymd: string): Date {
  return new Date(ymd + 'T12:00:00')
}

function fmtShort(ymd: string): string {
  return parseLocal(ymd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtRangeLabel(from: string, to: string): string {
  if (!from && !to) return ''
  if (from && to) {
    const f = parseLocal(from)
    const t = parseLocal(to)
    if (f.getFullYear() === t.getFullYear()) {
      return `${fmtShort(from)} – ${fmtShort(to)}, ${f.getFullYear()}`
    }
    return `${fmtShort(from)}, ${f.getFullYear()} – ${fmtShort(to)}, ${t.getFullYear()}`
  }
  return `${fmtShort(from)} – …`
}

function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  fullWidth = false,
  defaultOpen = false,
}: {
  from: string
  to: string
  onFromChange: (v: string) => void
  onToChange: (v: string) => void
  fullWidth?: boolean
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)
  const [viewYear, setViewYear] = useState(() => {
    const d = from ? parseLocal(from) : new Date()
    return d.getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    const d = from ? parseLocal(from) : new Date()
    return d.getMonth()
  })

  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onPointer(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function handleDayClick(ymd: string) {
    if (!from || (from && to)) {
      // Start fresh
      onFromChange(ymd)
      onToChange('')
    } else {
      // from set, no to yet
      if (ymd < from) {
        onToChange(from)
        onFromChange(ymd)
      } else if (ymd === from) {
        // clicking same day: treat as single-day range
        onToChange(ymd)
        setOpen(false)
      } else {
        onToChange(ymd)
        setOpen(false)
      }
    }
  }

  function clearDates() {
    onFromChange('')
    onToChange('')
    setOpen(false)
  }

  const hasValue = !!from || !!to

  // Build calendar cells
  const firstOfMonth = new Date(viewYear, viewMonth, 1)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const startPad = firstOfMonth.getDay() // 0=Sun

  const todayYMD = toYMD(new Date())

  // Effective end for range highlight (use hover if from set but no to)
  const effectiveTo = to || (from && hoveredDay && hoveredDay > from ? hoveredDay : null)
  const effectiveFrom = to ? from : (from && hoveredDay && hoveredDay < from ? hoveredDay : from)

  const label = fmtRangeLabel(from, to)
  const selecting = !!from && !to

  return (
    <div ref={containerRef} className={`relative ${fullWidth ? 'w-full' : ''}`}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 h-9 px-3 rounded-lg border text-sm transition-all ${open || hasValue
            ? 'border-[var(--accent)] bg-[var(--accent)]/8 text-[var(--foreground)]'
            : 'border-[var(--border)] bg-[var(--background)] text-[var(--muted)] hover:border-[var(--accent)]/50'
          } ${fullWidth ? 'w-full justify-between' : ''}`}
      >
        <CalendarRange size={13} className={hasValue ? 'text-[var(--accent)]' : 'text-[var(--muted)]'} />
        <span className={`text-[13px] ${hasValue ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}`}>
          {label || 'Filter by date'}
        </span>
        {hasValue && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); clearDates() }}
            className="ml-1 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <X size={12} />
          </span>
        )}
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div className={`absolute z-50 top-full mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl p-3 ${fullWidth ? 'left-0 right-0' : 'right-0'
          }`} style={{ minWidth: 280 }}>

          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-all"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-[13px] font-semibold text-[var(--foreground)]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-all"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Hint */}
          <p className="text-[10px] text-[var(--muted)] text-center mb-2">
            {selecting ? 'Click end date' : 'Click start date'}
          </p>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d) => (
              <div key={d} className="flex items-center justify-center h-7 text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isStart = ymd === from
              const isEnd = ymd === to || (from && !to && ymd === hoveredDay && ymd > from)
              const inRange =
                !!effectiveFrom && !!effectiveTo &&
                ymd > effectiveFrom && ymd < effectiveTo
              const isToday = ymd === todayYMD
              const isSelected = isStart || ymd === to

              return (
                <div key={ymd} className="relative flex items-center justify-center h-8">
                  {/* Range band */}
                  {(inRange || isStart || isEnd) && (
                    <span
                      className={`absolute inset-y-1 bg-[var(--accent)]/12 ${isStart ? 'left-1/2 right-0' : isEnd ? 'left-0 right-1/2' : 'left-0 right-0'
                        } ${isStart && isEnd ? 'hidden' : ''}`}
                    />
                  )}
                  <button
                    onClick={() => handleDayClick(ymd)}
                    onMouseEnter={() => setHoveredDay(ymd)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`relative z-10 w-7 h-7 text-[13px] rounded-full flex items-center justify-center transition-all font-medium ${isSelected
                        ? 'bg-[var(--accent)] text-white shadow-sm'
                        : isToday
                          ? 'text-[var(--accent)] font-semibold'
                          : 'text-[var(--foreground)] hover:bg-[var(--accent)]/20'
                      }`}
                  >
                    {day}
                    {isToday && !isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)]" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          {hasValue && (
            <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-[11px] text-[var(--muted)]">{label}</span>
              <button
                onClick={clearDates}
                className="text-[11px] font-medium text-red-400 hover:text-red-500 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Supporting components ─────────────────────────────────────────────────────

function StatusPill({ published }: { published: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${published
          ? 'badge-live text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
          : 'bg-[var(--border)] text-[var(--muted)]'
        }`}
    >
      {published ? (
        <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />Live</>
      ) : (
        'Draft'
      )}
    </span>
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
