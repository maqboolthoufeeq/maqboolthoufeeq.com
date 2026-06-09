'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import type { HubTopicDetail, HubCategoryRef } from '@/lib/hub'
import { type DateRange, EMPTY_RANGE, isRangeActive } from '@/lib/media-filter'
import MediaDateFilter from '@/components/social/MediaDateFilter'
import HubItemRenderer from './HubItemRenderer'
import { HubTopicCard } from './HubTopicCard'
import { HubBreadcrumb } from './HubBreadcrumb'
import { useHubFilter, type SortKey } from './useHubFilter'

/** Subtle uppercase section label. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{children}</h2>
}

/**
 * Full topic detail page: a tight, link-first layout — compact header, subtopics
 * row-cards, then content blocks stacked tightly. The search/sort/filter toolbar
 * only appears for content-heavy topics so small lists stay clean. No cover art.
 */
export default function HubTopicView({ topic }: { topic: HubTopicDetail }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>(EMPTY_RANGE)
  const [sortKey, setSortKey] = useState<SortKey>('newest')

  const itemsAsEntries = topic.items.map((item) => ({ ...item, kind: 'item' as const, href: '', itemType: item.type, path: topic.breadcrumb }))
  const filteredItems = useHubFilter(itemsAsEntries, search, activeCategory, dateRange, sortKey)
  const isFiltered = !!search || !!activeCategory || isRangeActive(dateRange)

  const itemCategories: HubCategoryRef[] = []
  const seen = new Set<string>()
  for (const it of topic.items) {
    if (it.category && !seen.has(it.category.slug)) { seen.add(it.category.slug); itemCategories.push(it.category) }
  }

  const hasContent = topic.children.length > 0 || topic.items.length > 0
  const showToolbar = topic.items.length > 6

  return (
    <div className="space-y-7">
      <HubBreadcrumb crumbs={topic.breadcrumb} current={topic.title} />

      {/* Header — compact */}
      <header className="flex items-start gap-3.5">
        <span className="shrink-0 grid place-items-center w-12 h-12 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] text-2xl font-semibold">
          {topic.icon || (topic.title[0]?.toUpperCase() ?? '?')}
        </span>
        <div className="flex-1 min-w-0 pt-0.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] leading-tight">{topic.title}</h1>
          {topic.description && <p className="text-[15px] text-[var(--muted)] leading-relaxed mt-1.5">{topic.description}</p>}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-xs text-[var(--muted)]">
            {topic.category && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: topic.category.color || 'var(--accent)' }} />
                {topic.category.name}
              </span>
            )}
            {topic.itemCount > 0 && <span>{topic.itemCount} item{topic.itemCount === 1 ? '' : 's'}</span>}
            {topic.date && <span>Updated {new Date(topic.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
          </div>
        </div>
      </header>

      {/* Subtopics */}
      {topic.children.length > 0 && (
        <section className="space-y-2.5">
          <SectionLabel>Subtopics</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {topic.children.map((child) => <HubTopicCard key={child.id} topic={child} />)}
          </div>
        </section>
      )}

      {/* Contents */}
      {topic.items.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <SectionLabel>{topic.children.length > 0 ? 'Contents' : ''}</SectionLabel>
            {showToolbar && (
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="h-9 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-xs font-medium">
                <option value="newest">Newest</option><option value="oldest">Oldest</option><option value="a-z">A–Z</option><option value="z-a">Z–A</option>
              </select>
            )}
          </div>

          {showToolbar && (
            <div className="space-y-2.5">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input type="text" placeholder="Search contents…" value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] text-sm" />
              </div>
              <MediaDateFilter onChange={setDateRange} />
              {itemCategories.length > 0 && (
                <div className="overflow-x-auto no-scrollbar">
                  <div className="flex gap-2 w-max pb-0.5">
                    <Chip active={!activeCategory} onClick={() => setActiveCategory(null)}>All</Chip>
                    {itemCategories.map((cat) => (
                      <Chip key={cat.slug} active={activeCategory === cat.slug} color={cat.color} onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)}>{cat.name}</Chip>
                    ))}
                  </div>
                </div>
              )}
              {isFiltered && filteredItems.length > 0 && (
                <p className="text-xs text-[var(--muted)]">Showing <span className="font-semibold text-[var(--foreground)]">{filteredItems.length}</span> of {topic.items.length}</p>
              )}
            </div>
          )}

          {filteredItems.length > 0 ? (
            <div className="space-y-2.5">
              {filteredItems.map((item) => <HubItemRenderer key={item.id} item={item} />)}
            </div>
          ) : (
            <EmptyState text="No items match your filters." />
          )}
        </section>
      )}

      {!hasContent && <EmptyState text="This topic is empty. Check back soon." />}
    </div>
  )
}

function Chip({ active, color, onClick, children }: { active: boolean; color?: string | null; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={['shrink-0 inline-flex items-center h-8 px-3 rounded-lg text-[13px] font-medium border transition-colors',
        active && !color ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
          : active ? 'text-white' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)]'].join(' ')}
      style={active && color ? { backgroundColor: color, borderColor: color } : undefined}>
      {children}
    </button>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-dashed border-[var(--border)] py-12 text-center">
      <Search size={24} className="text-[var(--muted)]" />
      <p className="text-sm text-[var(--muted)]">{text}</p>
    </div>
  )
}
