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

/**
 * Full topic detail page: breadcrumb, header, subtopics grid, and items section
 * (with its own search/sort/date filter). Mobile-first.
 */
export default function HubTopicView({ topic }: { topic: HubTopicDetail }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>(EMPTY_RANGE)
  const [sortKey, setSortKey] = useState<SortKey>('newest')

  const isItemsFiltered = search || activeCategory || isRangeActive(dateRange)

  // Filter and sort items (convert to HubEntry-like for the filter hook)
  const itemsAsEntries = topic.items.map((item) => ({
    ...item,
    kind: 'item' as const,
    href: '',
    itemType: item.type,
    path: topic.breadcrumb,
  }))

  const filteredItems = useHubFilter(itemsAsEntries, search, activeCategory, dateRange, sortKey)

  // Distinct categories present among this topic's items — powers the chip filter.
  const itemCategories: HubCategoryRef[] = []
  const seenCategory = new Set<string>()
  for (const it of topic.items) {
    if (it.category && !seenCategory.has(it.category.slug)) {
      seenCategory.add(it.category.slug)
      itemCategories.push(it.category)
    }
  }

  const hasContent = topic.children.length > 0 || topic.items.length > 0

  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <HubBreadcrumb crumbs={topic.breadcrumb} current={topic.title} />

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          {topic.icon && (
            <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-3xl font-semibold">
              {topic.icon}
            </div>
          )}

          {/* Title + Description */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-2">{topic.title}</h1>
            {topic.description && (
              <p className="text-base text-[var(--muted)] leading-relaxed mb-3">{topic.description}</p>
            )}

            {/* Date + Category + Tags */}
            <div className="flex flex-wrap items-center gap-3">
              {topic.date && (
                <span className="text-sm text-[var(--muted)]">
                  Updated {new Date(topic.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}

              {topic.category && (
                <span
                  className="inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: topic.category.color || 'var(--accent)' }}
                >
                  {topic.category.name}
                </span>
              )}

              {topic.tags.map((tag) => (
                <span
                  key={tag.slug}
                  className="inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium border border-[var(--border)] text-[var(--muted)]"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Cover image (if present) */}
        {topic.coverImage && (
          <div className="w-full rounded-xl overflow-hidden border border-[var(--border)]">
            <img src={topic.coverImage} alt={topic.title} className="w-full h-auto max-h-80 object-cover" />
          </div>
        )}
      </div>

      {/* Subtopics section */}
      {topic.children.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--foreground)]">Subtopics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topic.children.map((child) => (
              <HubTopicCard key={child.id} topic={child} />
            ))}
          </div>
        </div>
      )}

      {/* Items section with filter/sort toolbar */}
      {topic.items.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--foreground)]">Contents</h2>

          {/* Toolbar */}
          <div className="space-y-4">
            {/* Search + Sort */}
            <div className="flex gap-3 items-center">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="text"
                  placeholder="Search contents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2.5 pl-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] text-sm"
                />
              </div>

              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-sm font-medium"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="a-z">A–Z</option>
                <option value="z-a">Z–A</option>
              </select>
            </div>

            {/* Date filter */}
            <MediaDateFilter onChange={setDateRange} />

            {/* Category chips (only when items carry categories) */}
            {itemCategories.length > 0 && (
              <div className="overflow-x-auto no-scrollbar">
                <div className="flex gap-2 w-max pb-0.5">
                  <button
                    type="button"
                    onClick={() => setActiveCategory(null)}
                    aria-pressed={!activeCategory}
                    className={[
                      'shrink-0 inline-flex items-center h-9 px-3.5 rounded-lg text-[13px] font-medium border transition-colors',
                      !activeCategory
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                        : 'border-[var(--border)] bg-[var(--background)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)]',
                    ].join(' ')}
                  >
                    All
                  </button>
                  {itemCategories.map((cat) => {
                    const active = activeCategory === cat.slug
                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => setActiveCategory(active ? null : cat.slug)}
                        aria-pressed={active}
                        className={[
                          'shrink-0 inline-flex items-center h-9 px-3.5 rounded-lg text-[13px] font-medium border transition-colors',
                          active
                            ? 'text-white'
                            : 'border-[var(--border)] bg-[var(--background)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)]',
                        ].join(' ')}
                        style={active ? { backgroundColor: cat.color || 'var(--accent)', borderColor: cat.color || 'var(--accent)' } : undefined}
                      >
                        {cat.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Results summary */}
          {isItemsFiltered && filteredItems.length > 0 && (
            <p className="text-sm text-[var(--muted)]">
              Showing <span className="font-semibold text-[var(--foreground)]">{filteredItems.length}</span> of{' '}
              {topic.items.length} items
            </p>
          )}

          {/* Items list or empty state */}
          {filteredItems.length > 0 ? (
            <div className="space-y-8">
              {filteredItems.map((item) => (
                <HubItemRenderer key={item.id} item={item} />
              ))}
            </div>
          ) : isItemsFiltered ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border)] py-14 text-center">
              <Search size={28} className="text-[var(--muted)]" />
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">No items match your filters</p>
                <p className="text-xs text-[var(--muted)] mt-1">Try adjusting your search or filters</p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Empty state */}
      {!hasContent && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border)] py-14 text-center">
          <Search size={28} className="text-[var(--muted)]" />
          <p className="text-sm text-[var(--muted)]">This topic is empty. Check back soon.</p>
        </div>
      )}
    </div>
  )
}
