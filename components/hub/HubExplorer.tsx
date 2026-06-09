'use client'

import { useState } from 'react'
import { Search, ChevronRight } from 'lucide-react'
import type { HubLandingData, HubEntry } from '@/lib/hub'
import { type DateRange, EMPTY_RANGE, isRangeActive } from '@/lib/media-filter'
import MediaDateFilter from '@/components/social/MediaDateFilter'
import { HubTopicCard } from './HubTopicCard'
import { useHubFilter, type SortKey } from './useHubFilter'
import Link from 'next/link'

/**
 * Interactive explorer for the hub landing page. Shows topics in a grid by default,
 * or a flat list of entries when filtering by search/category/date. Includes:
 * - Search input (filters by title/description/tags/category)
 * - Sort select (Newest/Oldest/A–Z/Z–A)
 * - Date range filter (reuses MediaDateFilter)
 * - Category filter chips
 */
export default function HubExplorer({ data }: { data: HubLandingData }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>(EMPTY_RANGE)
  const [sortKey, setSortKey] = useState<SortKey>('newest')

  const isFiltered = search || activeCategory || isRangeActive(dateRange)

  // When filtering: render the flat entry list
  const filteredEntries = useHubFilter(data.entries, search, activeCategory, dateRange, sortKey)

  // When not filtering: render the topic grid
  const topicsToShow = isFiltered ? [] : data.topics

  return (
    <div className="space-y-8">
      {/* Toolbar */}
      <div className="space-y-4">
        {/* Search + Sort */}
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search topics, items, tags..."
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

        {/* Date filter + Category chips */}
        <div className="space-y-3">
          <MediaDateFilter onChange={setDateRange} />

          {/* Category filter chips (horizontal scroll on small screens) */}
          {data.categories.length > 0 && (
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

                {data.categories.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)}
                    aria-pressed={activeCategory === cat.slug}
                    className="shrink-0 inline-flex items-center h-9 px-3.5 rounded-lg text-[13px] font-medium border transition-colors"
                    style={
                      activeCategory === cat.slug
                        ? { backgroundColor: cat.color || 'var(--accent)', borderColor: cat.color || 'var(--accent)', color: 'white' }
                        : {
                            borderColor: 'var(--border)',
                            color: 'var(--muted)',
                          }
                    }
                    onMouseEnter={(e) => {
                      if (activeCategory !== cat.slug) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'
                        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeCategory !== cat.slug) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
                        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'
                      }
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content: Grid (no filter) or List (with filter) */}
      {isFiltered ? (
        <>
          {/* Filtered results summary */}
          {filteredEntries.length > 0 && (
            <p className="text-sm text-[var(--muted)]">
              Showing <span className="font-semibold text-[var(--foreground)]">{filteredEntries.length}</span> of{' '}
              {data.entries.length} results
            </p>
          )}

          {/* Flat entry list */}
          {filteredEntries.length > 0 ? (
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <EntryRow key={entry.id} entry={entry} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border)] py-14 text-center">
              <Search size={28} className="text-[var(--muted)]" />
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">No results found</p>
                <p className="text-xs text-[var(--muted)] mt-1">Try adjusting your filters or search terms</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Topic grid (default view) */}
          {topicsToShow.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topicsToShow.map((topic) => (
                <HubTopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border)] py-14 text-center">
              <Search size={28} className="text-[var(--muted)]" />
              <p className="text-sm text-[var(--muted)]">No topics yet. Check back soon.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/**
 * A single entry row in filtered view. Shows kind badge, title, description,
 * path breadcrumb, category/tags, and a link to the entry.
 */
function EntryRow({ entry }: { entry: HubEntry }) {
  return (
    <Link
      href={entry.href}
      className="group block rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)] hover:bg-[var(--background)]"
    >
      <div className="space-y-2">
        {/* Kind badge + Title + Arrow */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center h-5 px-2 rounded-full text-[11px] font-semibold uppercase bg-[var(--accent)]/10 text-[var(--accent)]">
                {entry.kind === 'topic' ? 'Topic' : entry.itemType}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
              {entry.title}
            </h4>
          </div>
          <ChevronRight size={18} className="text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors flex-shrink-0 mt-0.5" />
        </div>

        {/* Description */}
        {entry.description && (
          <p className="text-xs text-[var(--muted)] line-clamp-1">{entry.description}</p>
        )}

        {/* Path breadcrumb */}
        {entry.path.length > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-[var(--muted)]">
            {entry.path.map((crumb, i) => (
              <div key={`${crumb.slug}-${i}`} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                <span>{crumb.title}</span>
              </div>
            ))}
          </div>
        )}

        {/* Category + Tags */}
        {(entry.category || entry.tags.length > 0) && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {entry.category && (
              <span
                className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-medium text-white"
                style={{ backgroundColor: entry.category.color || 'var(--accent)' }}
              >
                {entry.category.name}
              </span>
            )}
            {entry.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.slug}
                className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-medium border border-[var(--border)] text-[var(--muted)]"
              >
                #{tag.name}
              </span>
            ))}
            {entry.tags.length > 2 && (
              <span className="inline-flex items-center h-5 px-1.5 text-[10px] font-medium text-[var(--muted)]">
                +{entry.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
