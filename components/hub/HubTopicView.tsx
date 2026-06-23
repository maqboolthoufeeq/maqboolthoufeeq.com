'use client'

import { useState } from 'react'
import { Search, Pencil, Plus, Trash2, ListPlus } from 'lucide-react'
import type { HubTopicDetail, HubCategoryRef } from '@/lib/hub'
import { type DateRange, EMPTY_RANGE, isRangeActive } from '@/lib/media-filter'
import MediaDateFilter from '@/components/social/MediaDateFilter'
import HubItemRenderer from './HubItemRenderer'
import { HubTopicCard } from './HubTopicCard'
import { HubBreadcrumb } from './HubBreadcrumb'
import { useHubAdmin } from './hub-admin'
import { useHubFilter, type SortKey } from './useHubFilter'

const SERIF = { fontFamily: 'var(--font-lora), serif' }

function SectionLabel({ label, count, children }: { label: string; count?: number; children?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-1">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
        {label}{count != null && <span className="ml-2 text-[var(--muted)]/60 tabular-nums">{count}</span>}
      </h2>
      {children}
    </div>
  )
}

/**
 * Editorial topic page: a serif headline with an uppercase kicker + meta line,
 * then numbered, rule-separated lists of subtopics and content. The search/sort/
 * filter toolbar appears only for content-heavy topics.
 */
export default function HubTopicView({ topic }: { topic: HubTopicDetail }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>(EMPTY_RANGE)
  const [sortKey, setSortKey] = useState<SortKey>('newest')

  const admin = useHubAdmin()

  const itemsAsEntries = topic.items.map((item) => ({ ...item, kind: 'item' as const, href: '', itemType: item.type, path: topic.breadcrumb }))
  const filteredItems = useHubFilter(itemsAsEntries, search, activeCategory, dateRange, sortKey)
  const isFiltered = !!search || !!activeCategory || isRangeActive(dateRange)

  const itemCategories: HubCategoryRef[] = []
  const seen = new Set<string>()
  for (const it of topic.items) if (it.category && !seen.has(it.category.slug)) { seen.add(it.category.slug); itemCategories.push(it.category) }

  const hasContent = topic.children.length > 0 || topic.items.length > 0
  const showToolbar = topic.items.length > 6

  const metaBits = [
    topic.itemCount > 0 ? `${topic.itemCount} item${topic.itemCount === 1 ? '' : 's'}` : null,
    topic.childCount > 0 ? `${topic.childCount} subtopic${topic.childCount === 1 ? '' : 's'}` : null,
    topic.date ? `Updated ${new Date(topic.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : null,
  ].filter(Boolean)

  return (
    <div className="space-y-9">
      <HubBreadcrumb crumbs={topic.breadcrumb} current={topic.title} />

      {/* Editorial header */}
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
          {topic.icon && <span className="mr-1.5">{topic.icon}</span>}{topic.category?.name || 'Topic'}
        </p>
        <h1 className="text-3xl sm:text-[2.6rem] font-bold text-[var(--foreground)] leading-[1.08]" style={SERIF}>{topic.title}</h1>
        {topic.description && <p className="text-[15px] sm:text-base text-[var(--muted)] leading-relaxed max-w-2xl">{topic.description}</p>}
        {metaBits.length > 0 && <p className="text-[11px] uppercase tracking-[0.15em] text-[var(--muted)]/80">{metaBits.join('  ·  ')}</p>}
      </header>

      {admin?.isAdmin && admin.editMode && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-2">
          <AdminBtn onClick={() => admin.editTopic(topic.id)}><Pencil size={15} /> Edit topic</AdminBtn>
          <AdminBtn onClick={() => admin.createTopic(topic.id)}><Plus size={15} /> Add subtopic</AdminBtn>
          <AdminBtn onClick={() => admin.manageItems(topic.id, topic.title, topic.items)}><ListPlus size={15} /> Manage content</AdminBtn>
          <div className="flex-1" />
          <AdminBtn danger onClick={() => admin.deleteTopic(topic.id, topic.title, hasContent)}><Trash2 size={15} /> Delete</AdminBtn>
        </div>
      )}

      {/* Subtopics */}
      {topic.children.length > 0 && (
        <section>
          <SectionLabel label="Subtopics" count={topic.children.length} />
          <div className="border-t border-[var(--border)]">
            {topic.children.map((child, i) => <HubTopicCard key={child.id} topic={child} index={i} />)}
          </div>
        </section>
      )}

      {/* Contents */}
      {topic.items.length > 0 && (
        <section>
          <SectionLabel label={topic.children.length > 0 ? 'Contents' : 'Links'} count={topic.items.length}>
            {showToolbar && (
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="h-8 px-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-xs font-medium">
                <option value="newest">Newest</option><option value="oldest">Oldest</option><option value="a-z">A–Z</option><option value="z-a">Z–A</option>
              </select>
            )}
          </SectionLabel>

          {showToolbar && (
            <div className="space-y-2.5 mb-3">
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
                    {itemCategories.map((cat) => <Chip key={cat.slug} active={activeCategory === cat.slug} color={cat.color} onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)}>{cat.name}</Chip>)}
                  </div>
                </div>
              )}
              {isFiltered && filteredItems.length > 0 && <p className="text-xs text-[var(--muted)]">Showing <span className="font-semibold text-[var(--foreground)]">{filteredItems.length}</span> of {topic.items.length}</p>}
            </div>
          )}

          {filteredItems.length > 0 ? (
            <div className="border-t border-[var(--border)]">
              {filteredItems.map((item, i) => <HubItemRenderer key={item.id} item={item} index={i} />)}
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
        active && !color ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : active ? 'text-white' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)]'].join(' ')}
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

function AdminBtn({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tap-scale inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px] font-medium border transition-colors ${
        danger
          ? 'border-red-500/40 text-red-500 hover:bg-red-500/10'
          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--accent)]'
      }`}
    >
      {children}
    </button>
  )
}
