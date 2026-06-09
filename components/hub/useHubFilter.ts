import { useMemo } from 'react'
import { type DateRange, isWithinRange } from '@/lib/media-filter'
import type { HubEntry, HubItemData } from '@/lib/hub'

export type SortKey = 'newest' | 'oldest' | 'a-z' | 'z-a'

/**
 * Filter and sort hook for hub entries or items. Applies search (title/description/
 * tags/category), category filter, and date range.
 */
export function useHubFilter<T extends HubEntry | HubItemData>(
  items: T[],
  search: string,
  activeCategory: string | null,
  dateRange: DateRange,
  sortKey: SortKey,
): T[] {
  return useMemo(() => {
    let filtered = items

    // Search: case-insensitive match on title, description, tag names, category name
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter((item) => {
        const title = item.title.toLowerCase()
        const desc = (item.description || '').toLowerCase()
        const tags = 'tags' in item ? (item.tags.map((t) => t.name) || []) : []
        const catName = item.category?.name.toLowerCase() || ''

        return (
          title.includes(q) ||
          desc.includes(q) ||
          tags.some((t) => t.toLowerCase().includes(q)) ||
          catName.includes(q)
        )
      })
    }

    // Category filter
    if (activeCategory && activeCategory !== 'all') {
      filtered = filtered.filter((item) => item.category?.slug === activeCategory)
    }

    // Date range filter
    if (dateRange.from !== null || dateRange.to !== null) {
      filtered = filtered.filter((item) => isWithinRange(item.sortDate, dateRange))
    }

    // Sort
    const sortFn = (a: T, b: T): number => {
      switch (sortKey) {
        case 'newest':
          return new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime()
        case 'oldest':
          return new Date(a.sortDate).getTime() - new Date(b.sortDate).getTime()
        case 'a-z':
          return a.title.localeCompare(b.title)
        case 'z-a':
          return b.title.localeCompare(a.title)
        default:
          return 0
      }
    }

    // Copy before sorting so we never mutate the input/prop array in place.
    return [...filtered].sort(sortFn)
  }, [items, search, activeCategory, dateRange, sortKey])
}
