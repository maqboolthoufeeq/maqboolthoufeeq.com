'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Tag = { id: string; name: string; slug: string }

export default function BlogSearch({ tags, initialQ, initialTag }: {
  tags: Tag[]
  initialQ: string
  initialTag: string
}) {
  const router = useRouter()
  const [q, setQ] = useState(initialQ)
  const [isPending, startTransition] = useTransition()

  function navigate(newQ: string, newTag: string) {
    const params = new URLSearchParams()
    if (newQ) params.set('q', newQ)
    if (newTag) params.set('tag', newTag)
    const qs = params.toString()
    startTransition(() => router.push(`/blog${qs ? `?${qs}` : ''}`))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    navigate(q, initialTag)
  }

  function toggleTag(slug: string) {
    navigate(q, initialTag === slug ? '' : slug)
  }

  const hasFilter = q || initialTag

  return (
    <div className="space-y-4 mb-10">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search posts…"
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          {isPending ? '…' : 'Search'}
        </button>
        {hasFilter && (
          <button
            type="button"
            onClick={() => { setQ(''); navigate('', '') }}
            className="px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] rounded-lg border border-[var(--border)] transition-colors"
          >
            Clear
          </button>
        )}
      </form>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.slug)}
              className={[
                'text-xs px-3 py-1 rounded-full border transition-colors',
                initialTag === tag.slug
                  ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)]',
              ].join(' ')}
            >
              #{tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
