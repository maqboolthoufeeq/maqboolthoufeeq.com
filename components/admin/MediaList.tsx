'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Search, Star, EyeOff, Plus, GripVertical, List, Grid3x3, LayoutGrid } from 'lucide-react'
import type { Platform } from '@/lib/social'
import { InstagramIcon, YoutubeIcon } from '@/components/social/icons'
import MediaItemCard, { type MediaListItem, type MediaItemCardProps, type MediaLayout } from '@/components/admin/MediaItemCard'

export type { MediaListItem }

type Category = { id: string; name: string }
type Filter = 'all' | 'featured' | 'hidden' | 'uncat' | `cat:${string}`
type View = 'comfortable' | 'small' | 'list'

const VIEW_STORAGE_KEY = 'admin-media-view'
const VIEW_OPTIONS: { key: View; label: string; icon: typeof List }[] = [
  { key: 'list', label: 'List', icon: List },
  { key: 'small', label: 'Small', icon: Grid3x3 },
  { key: 'comfortable', label: 'Large', icon: LayoutGrid },
]

const TABS: { key: Platform; label: string; icon: typeof InstagramIcon }[] = [
  { key: 'instagram', label: 'Reels', icon: InstagramIcon },
  { key: 'youtube', label: 'Videos', icon: YoutubeIcon },
]

export default function MediaList({
  initialItems,
  categories,
}: {
  initialItems: MediaListItem[]
  categories: Category[]
}) {
  const [items, setItems] = useState(initialItems)
  const [tab, setTab] = useState<Platform>('instagram')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [view, setView] = useState<View>('comfortable')
  const router = useRouter()

  // Remember the chosen card size across visits.
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY)
    if (saved === 'comfortable' || saved === 'small' || saved === 'list') setView(saved)
  }, [])
  function chooseView(v: View) {
    setView(v)
    try { localStorage.setItem(VIEW_STORAGE_KEY, v) } catch { /* ignore */ }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const counts = useMemo(
    () => ({
      instagram: items.filter((i) => i.platform === 'instagram').length,
      youtube: items.filter((i) => i.platform === 'youtube').length,
    }),
    [items],
  )

  const inTab = useMemo(
    () => items.filter((i) => i.platform === tab).sort((a, b) => a.order - b.order),
    [items, tab],
  )

  // Topics that actually have items in this tab (keeps the chip bar relevant).
  const tabTopics = useMemo(() => {
    const present = new Set(inTab.map((i) => i.categoryId).filter(Boolean) as string[])
    return categories.filter((c) => present.has(c.id))
  }, [inTab, categories])

  const q = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    return inTab.filter((i) => {
      if (q && !i.title.toLowerCase().includes(q)) return false
      if (filter === 'featured') return i.featured
      if (filter === 'hidden') return !i.published
      if (filter === 'uncat') return !i.categoryId
      if (filter.startsWith('cat:')) return i.categoryId === filter.slice(4)
      return true
    })
  }, [inTab, q, filter])

  const canReorder = filter === 'all' && !q

  async function patch(id: string, body: Record<string, unknown>) {
    return fetch(`/api/media/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = inTab.findIndex((i) => i.id === active.id)
    const newIndex = inTab.findIndex((i) => i.id === over.id)
    const reordered = arrayMove(inTab, oldIndex, newIndex)
    const prev = items
    const orderById = new Map(reordered.map((it, idx) => [it.id, idx]))
    setItems((all) =>
      all.map((it) => {
        const o = orderById.get(it.id)
        return o === undefined ? it : { ...it, order: o }
      }),
    )
    try {
      const res = await Promise.all(reordered.map((it, idx) => patch(it.id, { order: idx })))
      if (res.some((r) => !r.ok)) throw new Error()
      router.refresh()
    } catch {
      setItems(prev)
      router.refresh()
    }
  }

  async function toggleFeatured(item: MediaListItem) {
    const next = !item.featured
    setItems((all) => all.map((i) => (i.id === item.id ? { ...i, featured: next } : i)))
    const res = await patch(item.id, { featured: next })
    if (!res.ok) setItems((all) => all.map((i) => (i.id === item.id ? { ...i, featured: !next } : i)))
    else router.refresh()
  }

  async function togglePublished(item: MediaListItem) {
    const next = !item.published
    setItems((all) => all.map((i) => (i.id === item.id ? { ...i, published: next } : i)))
    const res = await patch(item.id, { published: next })
    if (!res.ok) setItems((all) => all.map((i) => (i.id === item.id ? { ...i, published: !next } : i)))
    else router.refresh()
  }

  async function handleDelete(item: MediaListItem) {
    if (!confirm(`Delete “${item.title}”?`)) return
    setItems((all) => all.filter((i) => i.id !== item.id))
    await fetch(`/api/media/${item.id}`, { method: 'DELETE' })
    router.refresh()
  }

  const chips: { key: Filter; label: string; icon?: React.ReactNode }[] = [
    { key: 'all', label: 'All' },
    { key: 'featured', label: 'Featured', icon: <Star size={12} className="fill-current" /> },
    { key: 'hidden', label: 'Hidden', icon: <EyeOff size={12} /> },
    ...tabTopics.map((c) => ({ key: `cat:${c.id}` as Filter, label: c.name })),
    ...(inTab.some((i) => !i.categoryId) ? [{ key: 'uncat' as Filter, label: 'No topic' }] : []),
  ]

  const layout: MediaLayout = view === 'list' ? 'list' : 'card'

  return (
    <div className="space-y-4">
      {/* Platform tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setTab(key); setQuery(''); setFilter('all') }}
            className={[
              'tap-scale flex-1 h-10 rounded-xl text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors',
              tab === key ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-[var(--foreground)]',
            ].join(' ')}
          >
            <Icon size={16} />
            {label}
            <span className={`text-xs ${tab === key ? 'text-white/80' : 'text-[var(--muted)]'}`}>{counts[key]}</span>
          </button>
        ))}
      </div>

      {/* Search + add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${tab === 'instagram' ? 'reels' : 'videos'}…`}
            className="w-full h-11 pl-9 pr-3 text-sm rounded-2xl sm:rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
        <Link
          href={`/admin/media/new?platform=${tab}`}
          className="tap-scale shrink-0 h-11 px-4 inline-flex items-center gap-1.5 rounded-2xl sm:rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90"
        >
          <Plus size={16} strokeWidth={2.4} />
          <span className="hidden sm:inline">Add</span>
        </Link>
      </div>

      {/* Filter chips + view size */}
      {inTab.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1 -mx-1 px-1 pb-0.5">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setFilter(c.key)}
                className={[
                  'shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border transition-colors',
                  filter === c.key
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                    : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)]',
                ].join(' ')}
              >
                {c.icon}
                {c.label}
              </button>
            ))}
          </div>
          <div className="shrink-0 flex items-center gap-0.5 p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            {VIEW_OPTIONS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => chooseView(key)}
                aria-label={`${label} view`}
                title={`${label} view`}
                className={[
                  'tap-scale inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                  view === key ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-[var(--foreground)]',
                ].join(' ')}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      {inTab.length === 0 ? (
        <EmptyState platform={tab} />
      ) : filtered.length === 0 ? (
        <p className="text-[var(--muted)] text-sm text-center py-12">Nothing matches this filter.</p>
      ) : canReorder ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={filtered.map((i) => i.id)}
            strategy={view === 'list' ? verticalListSortingStrategy : rectSortingStrategy}
          >
            <Container view={view}>
              {filtered.map((item) => (
                <SortableCard key={item.id} item={item} layout={layout} onFeatured={toggleFeatured} onPublished={togglePublished} onDelete={handleDelete} />
              ))}
            </Container>
          </SortableContext>
        </DndContext>
      ) : (
        <Container view={view}>
          {filtered.map((item) => (
            <MediaItemCard key={item.id} item={item} layout={layout} onFeatured={toggleFeatured} onPublished={togglePublished} onDelete={handleDelete} />
          ))}
        </Container>
      )}

      {canReorder && filtered.length > 1 && (
        <p className="text-xs text-[var(--muted)] text-center">Drag the handle to reorder • tap ★ to feature • tap the eye to hide.</p>
      )}
    </div>
  )
}

function Container({ view, children }: { view: View; children: React.ReactNode }) {
  if (view === 'list') return <div className="flex flex-col gap-2">{children}</div>
  const cols =
    view === 'small'
      ? 'grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-2'
      : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'
  return <div className={`grid ${cols} items-start`}>{children}</div>
}

function SortableCard(props: Omit<MediaItemCardProps, 'dragHandle' | 'setNodeRef' | 'style'>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.item.id })
  // Neutral grip — MediaItemCard positions it per layout.
  const handle = (
    <button
      {...listeners}
      {...attributes}
      aria-label="Drag to reorder"
      className="inline-flex items-center justify-center touch-none cursor-grab active:cursor-grabbing text-current"
    >
      <GripVertical size={13} />
    </button>
  )
  return (
    <MediaItemCard
      {...props}
      dragHandle={handle}
      setNodeRef={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : undefined, zIndex: isDragging ? 20 : undefined }}
    />
  )
}

function EmptyState({ platform }: { platform: Platform }) {
  const isReel = platform === 'instagram'
  return (
    <div className="text-center py-14 px-4">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] mb-3">
        {isReel ? <InstagramIcon size={26} /> : <YoutubeIcon size={26} />}
      </div>
      <p className="text-[var(--foreground)] font-medium">No {isReel ? 'reels' : 'videos'} yet</p>
      <p className="text-sm text-[var(--muted)] mt-1 mb-4">
        Paste a {isReel ? 'reel' : 'video / short'} link — the title and thumbnail fill in automatically.
      </p>
      <Link
        href={`/admin/media/new?platform=${platform}`}
        className="tap-scale inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[var(--accent)] text-white text-sm font-medium"
      >
        <Plus size={16} strokeWidth={2.4} /> Add {isReel ? 'reel' : 'video'}
      </Link>
    </div>
  )
}
