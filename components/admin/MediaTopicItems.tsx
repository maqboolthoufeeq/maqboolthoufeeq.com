'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FolderMinus, FolderOpen } from 'lucide-react'
import MediaItemCard, { type MediaListItem } from '@/components/admin/MediaItemCard'
import { InstagramIcon, YoutubeIcon } from '@/components/social/icons'

/**
 * The items belonging to one topic, shown in the admin topic-detail page with
 * feature / hide / edit / delete and a "remove from this topic" action, plus
 * shortcuts to add a new reel or video straight into the topic.
 */
export default function MediaTopicItems({
  categoryId,
  initialItems,
}: {
  categoryId: string
  initialItems: MediaListItem[]
}) {
  const [items, setItems] = useState(initialItems)
  const router = useRouter()

  async function patch(id: string, body: Record<string, unknown>) {
    return fetch(`/api/media/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
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

  async function removeFromTopic(item: MediaListItem) {
    if (!confirm(`Remove “${item.title}” from this topic? It stays on your site, just untagged.`)) return
    setItems((all) => all.filter((i) => i.id !== item.id))
    await patch(item.id, { categoryId: null })
    router.refresh()
  }

  const topicPath = `/admin/media/categories/${categoryId}`
  const fromQ = `&from=${encodeURIComponent(topicPath)}`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/media/new?platform=instagram&category=${categoryId}${fromQ}`}
          className="tap-scale inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90"
        >
          <InstagramIcon size={15} /> Add reel
        </Link>
        <Link
          href={`/admin/media/new?platform=youtube&category=${categoryId}${fromQ}`}
          className="tap-scale inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-[var(--border)] text-[var(--foreground)] text-sm font-medium hover:border-[var(--accent)]"
        >
          <YoutubeIcon size={15} /> Add video
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-14 px-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] mb-3">
            <FolderOpen size={26} />
          </div>
          <p className="text-[var(--foreground)] font-medium">No reels or videos in this topic yet</p>
          <p className="text-sm text-[var(--muted)] mt-1">
            Add one above, or assign existing items to this topic from their edit screen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-start">
          {items.map((item) => (
            <MediaItemCard
              key={item.id}
              item={item}
              backTo={topicPath}
              onFeatured={toggleFeatured}
              onPublished={togglePublished}
              onDelete={handleDelete}
              extraAction={
                <button
                  onClick={() => removeFromTopic(item)}
                  aria-label="Remove from topic"
                  title="Remove from this topic"
                  className="tap-scale p-1.5 rounded-lg text-[var(--muted)] hover:text-amber-500"
                >
                  <FolderMinus size={15} />
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
