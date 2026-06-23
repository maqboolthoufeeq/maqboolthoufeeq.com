'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ArrowUpRight, ArrowRight, Plus } from 'lucide-react'
import type { HubLandingData, HubEntry } from '@/lib/hub'
import { type DateRange, EMPTY_RANGE, isRangeActive } from '@/lib/media-filter'
import MediaDateFilter from '@/components/social/MediaDateFilter'
import { HubTopicCard } from './HubTopicCard'
import { useHubAdmin } from './hub-admin'
import { useHubFilter, type SortKey } from './useHubFilter'

/**
 * Editorial hub explorer: a search/sort/filter toolbar over a numbered,
 * rule-separated list of topics. When a filter is active it switches to a flat,
 * numbered list of matching topics + content blocks (with breadcrumb context).
 */
export default function HubExplorer({ data }: { data: HubLandingData }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>(EMPTY_RANGE)
  const [sortKey, setSortKey] = useState<SortKey>('newest')

  const admin = useHubAdmin()
  const isFiltered = !!search || !!activeCategory || isRangeActive(dateRange)
  const filteredEntries = useHubFilter(data.entries, search, activeCategory, dateRange, sortKey)

  return (
    <div className="space-y-6">
      {admin?.isAdmin && admin.editMode && (
        <button
          type="button"
          onClick={() => admin.createTopic(null)}
          className="tap-scale w-full h-11 rounded-xl border border-dashed border-[var(--accent)]/50 text-[var(--accent)] hover:bg-[var(--accent)]/5 inline-flex items-center justify-center gap-1.5 font-medium transition-colors"
        >
          <Plus size={17} strokeWidth={2.4} /> Add topic
        </button>
      )}

      {/* Toolbar */}
      <div className="space-y-3">
        <div className="flex gap-2.5 items-center">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input type="text" placeholder="Search topics, items, tags…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] text-sm" />
          </div>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="h-10 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-sm font-medium">
            <option value="newest">Newest</option><option value="oldest">Oldest</option><option value="a-z">A–Z</option><option value="z-a">Z–A</option>
          </select>
        </div>
        <MediaDateFilter onChange={setDateRange} />
        {data.categories.length > 0 && (
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex gap-2 w-max pb-0.5">
              <Chip active={!activeCategory} onClick={() => setActiveCategory(null)}>All</Chip>
              {data.categories.map((cat) => <Chip key={cat.slug} active={activeCategory === cat.slug} color={cat.color} onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)}>{cat.name}</Chip>)}
            </div>
          </div>
        )}
      </div>

      {isFiltered ? (
        filteredEntries.length > 0 ? (
          <div>
            <p className="text-[11px] uppercase tracking-[0.15em] text-[var(--muted)] mb-1">
              Showing <span className="text-[var(--foreground)] tabular-nums">{filteredEntries.length}</span> of {data.entries.length}
            </p>
            <div className="border-t border-[var(--border)]">
              {filteredEntries.map((entry, i) => <EntryRow key={entry.id} entry={entry} index={i} />)}
            </div>
          </div>
        ) : (
          <Empty text="No results found. Try adjusting your search or filters." />
        )
      ) : data.topics.length > 0 ? (
        <div className="border-t border-[var(--border)]">
          {data.topics.map((topic, i) => <HubTopicCard key={topic.id} topic={topic} index={i} />)}
        </div>
      ) : (
        <Empty text="No topics yet. Check back soon." />
      )}
    </div>
  )
}

function EntryRow({ entry, index }: { entry: HubEntry; index: number }) {
  const label = entry.kind === 'topic' ? 'Topic' : (entry.itemType ?? 'Item')
  const path = entry.path.map((c) => c.title).join(' / ')
  const ArrowIcon = entry.kind === 'item' && entry.itemType === 'link' ? ArrowUpRight : ArrowRight
  return (
    <Link href={entry.href} className="group flex items-start gap-4 py-3.5 border-b border-[var(--border)]">
      <span className="shrink-0 w-7 text-sm tabular-nums text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors pt-0.5">{String(index + 1).padStart(2, '0')}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors">{entry.title}</span>
        <span className="block text-xs text-[var(--muted)] truncate mt-0.5">
          {path}{entry.description ? `${path ? '  ·  ' : ''}${entry.description}` : ''}
        </span>
      </span>
      <span className="shrink-0 self-center text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">{label}</span>
      <ArrowIcon size={16} className="shrink-0 self-center text-[var(--muted)] group-hover:text-[var(--accent)] transition-all" />
    </Link>
  )
}

function Chip({ active, color, onClick, children }: { active: boolean; color?: string | null; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={['shrink-0 inline-flex items-center h-9 px-3.5 rounded-lg text-[13px] font-medium border transition-colors',
        active && !color ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : active ? 'text-white' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)]'].join(' ')}
      style={active && color ? { backgroundColor: color, borderColor: color } : undefined}>
      {children}
    </button>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-dashed border-[var(--border)] py-14 text-center">
      <Search size={26} className="text-[var(--muted)]" />
      <p className="text-sm text-[var(--muted)]">{text}</p>
    </div>
  )
}
