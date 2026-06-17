'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { SearchResult } from '@/lib/search'

const BADGE_COLORS: Record<string, string> = {
  Blog:    'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
  Project: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800',
  Hub:     'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950 border-violet-200 dark:border-violet-800',
  Reel:    'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800',
  Video:   'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
}

const BADGE_ICONS: Record<string, string> = {
  Blog: '📝', Project: '🚀', Hub: '🔗', Reel: '🎬', Video: '▶️',
}

type FilterKey = 'all' | 'post' | 'project' | 'hub' | 'reel' | 'video'

const TYPE_TO_FILTER: Record<SearchResult['type'], FilterKey> = {
  post: 'post', project: 'project',
  hub_topic: 'hub', hub_item: 'hub',
  reel: 'reel', video: 'video',
}

const FILTER_TABS: { key: FilterKey; icon: string; label: string }[] = [
  { key: 'all',     icon: '',   label: 'All' },
  { key: 'post',    icon: '📝', label: 'Blog' },
  { key: 'project', icon: '🚀', label: 'Projects' },
  { key: 'hub',     icon: '🔗', label: 'Hub' },
  { key: 'reel',    icon: '🎬', label: 'Reels' },
  { key: 'video',   icon: '▶️', label: 'Videos' },
]

const GROUP_DEFS: { filterKey: FilterKey; title: string }[] = [
  { filterKey: 'post',    title: 'Blog Posts' },
  { filterKey: 'project', title: 'Projects' },
  { filterKey: 'hub',     title: 'Hub' },
  { filterKey: 'reel',    title: 'Reels' },
  { filterKey: 'video',   title: 'Videos' },
]

const INIT_ALL = 5     // per group when showing all categories
const INIT_FILTERED = 12
const STEP = 5

function ResultCard({ result }: { result: SearchResult }) {
  return (
    <Link
      href={result.href}
      className="group flex items-start gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--surface)] hover:border-[var(--accent)]/30 transition-all"
    >
      <span className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-[var(--surface)] flex items-center justify-center">
        {result.imageUrl ? (
          <img src={result.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl leading-none select-none">
            {result.icon ?? BADGE_ICONS[result.badge] ?? '📄'}
          </span>
        )}
      </span>
      <div className="flex-1 min-w-0">
        <span className={`inline-flex items-center mb-1 text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-md border ${BADGE_COLORS[result.badge] ?? 'text-[var(--muted)] bg-[var(--surface)] border-[var(--border)]'}`}>
          {result.badge}
        </span>
        <p className="font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors truncate">
          {result.title}
        </p>
        {result.excerpt && (
          <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">{result.excerpt}</p>
        )}
        <p className="mt-1.5 text-xs text-[var(--muted)]/60 truncate">{result.href}</p>
      </div>
    </Link>
  )
}

export default function SearchResults({ results }: { results: SearchResult[] }) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [shown, setShown] = useState<Record<string, number>>({})

  // Count per filter key
  const counts = results.reduce<Record<FilterKey, number>>(
    (acc, r) => {
      const fk = TYPE_TO_FILTER[r.type]
      acc[fk] = (acc[fk] ?? 0) + 1
      acc.all = (acc.all ?? 0) + 1
      return acc
    },
    { all: 0, post: 0, project: 0, hub: 0, reel: 0, video: 0 },
  )

  function changeFilter(key: FilterKey) {
    setFilter(key)
    setShown({})
  }

  function getLimit(gKey: string) {
    const def = filter === 'all' ? INIT_ALL : INIT_FILTERED
    return shown[gKey] ?? def
  }

  function loadMore(gKey: string, total: number) {
    const def = filter === 'all' ? INIT_ALL : INIT_FILTERED
    setShown(p => ({ ...p, [gKey]: Math.min((p[gKey] ?? def) + STEP, total) }))
  }

  const visibleGroups = GROUP_DEFS
    .filter(g => filter === 'all' || filter === g.filterKey)
    .map(g => ({
      ...g,
      items: results.filter(r => TYPE_TO_FILTER[r.type] === g.filterKey),
    }))
    .filter(g => g.items.length > 0)

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto pb-1 mb-6 -mx-1 px-1 scrollbar-none">
        {FILTER_TABS.filter(f => f.key === 'all' || (counts[f.key] ?? 0) > 0).map(f => {
          const count = counts[f.key] ?? 0
          const isActive = filter === f.key
          return (
            <button
              key={f.key}
              onClick={() => changeFilter(f.key)}
              title={f.label}
              className={`shrink-0 inline-flex items-center gap-0.5 h-8 px-2.5 rounded-full text-sm font-medium border transition-all ${
                isActive
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
                  : 'bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)]'
              }`}
            >
              <span className="text-xs font-semibold tracking-wide">{f.label}</span>
              <sup className={`text-[9px] font-bold leading-none ml-0.5 ${isActive ? 'text-white/80' : 'text-[var(--accent)]'}`}>
                {count}
              </sup>
            </button>
          )
        })}
      </div>

      {/* Result groups */}
      <div className="flex flex-col gap-8">
        {visibleGroups.map(g => {
          const limit = getLimit(g.filterKey)
          const visible = g.items.slice(0, limit)
          const remaining = g.items.length - visible.length
          return (
            <section key={g.filterKey}>
              <h2 className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)] mb-3">
                {g.title}{' '}
                <span className="opacity-60">({g.items.length})</span>
              </h2>
              <div className="flex flex-col gap-2">
                {visible.map(r => <ResultCard key={r.id} result={r} />)}
              </div>
              {remaining > 0 && (
                <button
                  onClick={() => loadMore(g.filterKey, g.items.length)}
                  className="mt-3 text-sm font-medium text-[var(--accent)] hover:underline underline-offset-2 transition-colors"
                >
                  Show {Math.min(remaining, STEP)} more in {g.title}
                </button>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
